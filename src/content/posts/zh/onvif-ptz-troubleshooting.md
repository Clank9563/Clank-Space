---
title: ONVIF錯誤排查
description: 用 Python onvif-zeep 控制 PTZ 攝影機時，Media1 的 GetProfiles 失敗，拿不到 ProfileToken 就無法轉向。這篇記錄六個排查步驟，以及怎麼手動組 SOAP 呼叫 Media2 繞過問題。
date: 2026-11-20
category: network
tags: [ONVIF, Python, PTZ, SOAP]
translationKey: onvif-ptz-troubleshooting
---

用 Python 套件 `onvif-zeep` 控制 PTZ（Pan-Tilt-Zoom）攝影機時，Media1 服務的 `GetProfiles` 一直失敗。轉向指令需要 `ProfileToken`，拿不到它，攝影機就轉不動。這篇照排查順序記錄六個步驟，每一步排除一類原因。

| 步驟 | 檢查什麼 | 排除的問題 |
| --- | --- | --- |
| 1 | 連線、帳密、權限等級 | 網路 / port / 帳密 / 權限 |
| 2 | 攝影機與電腦的 UTC 時間差 | 時間不同步造成的驗證失敗 |
| 3 | 套件 `xaddrs` vs. 攝影機 `GetServices` | 服務網址錯誤、套件漏掉的服務 |
| 4 | 逐一測試 Media1 / PTZ 指令 | 確認哪個服務壞、哪個正常 |
| 5 | 手動組 SOAP 呼叫 Media2 `GetProfiles` | 繞過壞掉的 Media1 取得 ProfileToken |
| 6 | 用 ProfileToken 讀 PTZ 狀態、查預置點 | 確認 Token 正確、分清三種 Token |

範例中的 `IP`、`USER`、`PASS` 請換成實際值，所有 `TEST_` 開頭的 token 都是示意用的假值。

## Step 1：連線、帳密與權限

```python
camera = ONVIFCamera(IP, 80, USER, PASS)          # 抓服務清單
info = camera.devicemgmt.GetDeviceInformation()   # 需要登入
users = camera.devicemgmt.GetUsers()              # 需要登入，列出權限等級
```

如果 `ONVIFCamera(...)` 這一步就失敗，多半是網路層問題：IP 錯或攝影機沒開機、port 不對（不一定是 80）、被防火牆或路由器擋住。少數攝影機在這一步就會驗證帳密，所以帳密錯也可能停在這裡。

看錯誤訊息就能分辨：

- `timeout`、`Connection refused`：網路問題
- `NotAuthorized`、`401`：帳密問題

ONVIF 的權限只有三級：

| 等級 | 能做什麼 |
| --- | --- |
| Administrator | 全部，包含修改設定、管理使用者 |
| Operator | 操作類，**PTZ 轉向至少需要這級** |
| User | 只能觀看影像 |

例如 `test_operator` 是 Operator（轉向用），`test_viewer` 是 User（只看串流）。我這次用的是 Administrator 帳號，權限不是問題。

## Step 2：檢查時間同步

```python
dt = camera.devicemgmt.GetSystemDateAndTime()
d, t = dt.UTCDateTime.Date, dt.UTCDateTime.Time
cam_time = datetime.datetime(d.Year, d.Month, d.Day, t.Hour, t.Minute, t.Second,
                             tzinfo=datetime.timezone.utc)
pc_time = datetime.datetime.now(datetime.timezone.utc)
print("相差秒數:", abs((pc_time - cam_time).total_seconds()))
```

比較時一律用 UTC。UTC 沒有時區和夏令時間的問題，而且 ONVIF 規定登入時間戳記用 UTC；拿台灣時間（UTC+8）去比，會多出 8 小時的假差距。

時間差太大（例如差 10 分鐘）時，第一個出錯的通常是 `GetDeviceInformation()`，因為 `ONVIFCamera(...)` 多半不需要登入。錯誤訊息是 `NotAuthorized / Sender not authorized`，**跟密碼錯誤一模一樣**，所以時間一定要單獨檢查。至於差多少會失敗，要看攝影機的實作。

## Step 3：比對服務網址

```python
# 方法 A：套件整理的網址
for name, url in camera.xaddrs.items(): print(name, url)

# 方法 B：直接問攝影機
for s in camera.devicemgmt.GetServices({"IncludeCapability": False}):
    print(s.Namespace, s.XAddr)
```

如果攝影機回報的 XAddr 是內網 IP，從外部會連不上，這時要改寫 `xaddrs`。這台回報的是外網 IP，不用處理。

這台攝影機有兩個 Media 服務：

| Namespace | 網址 | 說明 |
| --- | --- | --- |
| `ver10/media/wsdl` | `/onvif/media_service` | Media1（舊版） |
| `ver20/media/wsdl` | `/onvif/media2_service` | Media2（新版，主要為了 H.265 等新編碼） |

重要的發現是：方法 A 的結果裡沒有 `media2_service`，方法 B 有。`onvif-zeep` 不認識 Media2，自動把它漏掉了，所以之後要自己送 SOAP 查 Media2。

## Step 4：逐一測試指令

```python
media = camera.create_media_service()
ptz = camera.create_ptz_service()
tests = [
    ("Media1 GetProfiles", lambda: media.GetProfiles()),
    ("Media1 GetVideoSources", lambda: media.GetVideoSources()),
    ("Media1 GetVideoEncoderConfigurations", lambda: media.GetVideoEncoderConfigurations()),
    ("PTZ GetNodes", lambda: ptz.GetNodes()),
    ("PTZ GetConfigurations", lambda: ptz.GetConfigurations()),
]
for name, action in tests:
    try:
        action(); print("✅", name)
    except Exception as e:
        print("❌", name, "→", repr(e))
```

這是整個排查的關鍵轉折：**PTZ 指令成功，Media1 `GetProfiles` 失敗。**

這代表 PTZ 服務本身是健康的，轉向功能沒壞，缺的只是 `ProfileToken` 這個參數。換個方式拿到 Token 就能轉向。Media2 是獨立的服務，Media1 壞了不代表它也壞，所以改從 Media2 拿。

Media1 為什麼會失敗，這次沒有查出根本原因。

## Step 5：手動組 SOAP 呼叫 Media2

`onvif-zeep` 沒有 `create_media2_service()`，只能自己組 SOAP 再用 `requests` 送出。SOAP 的結構是：

```
Envelope（信封）
 ├─ Header   ← 登入資訊（WS-Security UsernameToken）
 └─ Body     ← 要呼叫的指令（GetProfiles）
```

Header 裡的密碼要算成 Digest：

```
Digest = Base64( SHA1( Nonce + Created + 密碼 ) )
```

- `Nonce`：隨機 16 bytes
- `Created`：現在的 UTC 時間，這也是 Step 2 要先確認時間同步的原因

```python
nonce = os.urandom(16)
created = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
digest = base64.b64encode(hashlib.sha1(nonce + created.encode() + PASS.encode()).digest()).decode()

# Body 部分：
# <tr2:GetProfiles><tr2:Type>All</tr2:Type></tr2:GetProfiles>
# 其中 xmlns:tr2="http://www.onvif.org/ver20/media/wsdl"

r = requests.post(f"http://{IP}/onvif/media2_service", data=soap,
                  headers={"Content-Type": "application/soap+xml"}, timeout=10)
```

`soap` 是把上面的 Header 和 Body 組起來的完整 XML，這裡省略。

### Nonce 為什麼每次都要隨機

為了防止重放攻擊（replay attack）。如果 Nonce 固定，別人攔截到登入請求後可以原封不動重送；Nonce 每次不同，攝影機又會拒絕用過的值，偷來的請求就失效了。可以把它想成一次性驗證碼。

### 從回應找 Token

找最外層的 `<tr2:Profiles token="...">`，下面的 `<tr2:Name>` 是名稱：

| Token | Name |
| --- | --- |
| `TEST_PROFILE_A` | Max view |
| `TEST_PROFILE_B` | Recording |
| `TEST_PROFILE_C` | Live view |

每個 Profile 裡都有 `<tr2:PTZ token="TEST_PTZ_CONFIG">`，表示它已經綁定 PTZ 設定，三個都能用來轉向。我選了 `TEST_PROFILE_A`。

### 用 HTTP 狀態碼判斷方向

| 結果 | 意義 | 回頭檢查 |
| --- | --- | --- |
| `401 Unauthorized` | 登入問題 | Step 1 帳密 / 權限、**Step 2 時間差（最容易被忽略）** |
| `404 Not Found` / SOAP Fault | 網址或 Namespace 錯 | Step 3 服務網址 |

## Step 6：驗證 Token、查預置點

```python
ptz = camera.create_ptz_service()
PROFILE_TOKEN = "TEST_PROFILE_A"

status = ptz.GetStatus({"ProfileToken": PROFILE_TOKEN})   # 讀得到位置 = Token 有效
print(status.Position.PanTilt.x, status.Position.PanTilt.y)

for p in ptz.GetPresets({"ProfileToken": PROFILE_TOKEN}):
    print(p.token, "→", p.Name)
```

我也試了把 Profile 裡 PTZ 區塊的 token 拿來當 ProfileToken，結果不行：

```
OK   TEST_PROFILE_A   → 讀到位置 0.xx
FAIL TEST_PTZ_CONFIG  → The requested profile token ProfileToken does not exist.
FAIL abc              → The requested profile token ProfileToken does not exist.
```

傳錯 Token 會得到 SOAP Fault，訊息是「找不到這個 Profile」。

### Profile 像一個資料夾

```
TEST_PROFILE_A                ← ProfileToken（資料夾）
 ├─ VideoSource   token="TEST_VSRC_CONFIG"
 ├─ VideoEncoder  token="TEST_VENC_CONFIG"
 ├─ AudioEncoder  token="TEST_AENC_CONFIG"
 └─ PTZ           token="TEST_PTZ_CONFIG"   ← PTZConfigurationToken（資料夾裡的檔案）
```

只有 XML 最外層 `<tr2:Profiles token="...">` 才是 ProfileToken，巢狀在裡面的都是別的東西。

### 三種 Token

| 名稱 | 來源 | 例子 | 用途 |
| --- | --- | --- | --- |
| ProfileToken | Media2 `GetProfiles` | `TEST_PROFILE_A` | 指定用哪個 Profile 操作攝影機 |
| PresetToken | `GetPresets` 的 `p.token` | `TEST_PRESET_01` | 指定要去哪個預置點 |
| PTZConfigurationToken | Profile 內的 PTZ 區塊 | `TEST_PTZ_CONFIG` | PTZ 設定檔，轉向用不到 |

預置點也要分清楚 `token` 和 `Name`：`token` 是攝影機內部的識別碼，程式呼叫要傳這個；`Name`（例如 `Preset001`）是給人看的名稱，可以在網頁介面改，不能拿來呼叫。

### 最終呼叫

```python
ptz.GotoPreset({
    "ProfileToken": "TEST_PROFILE_A",  # 用哪個 Profile
    "PresetToken":  "TEST_PRESET_01",  # 去哪個預置點
})
```

## 重點速記

1. 連不上時，先分辨是網路（`timeout` / `Connection refused`）還是驗證（`401` / `NotAuthorized`）。
2. PTZ 轉向至少要 Operator 權限。
3. 驗證失敗但確定帳密正確，就檢查 UTC 時間差。
4. `onvif-zeep` 不支援 Media2，`xaddrs` 會漏掉 `media2_service`，要用 `GetServices` 確認。
5. Media1 `GetProfiles` 壞掉時，手動送 SOAP 到 Media2 拿 ProfileToken。
6. `GotoPreset` 要兩個 token：ProfileToken 和 PresetToken。不是預置點的 Name，也不是 PTZConfigurationToken。

最後提醒一點：密碼不要直接寫在程式裡，改用環境變數之類的方式傳入，程式碼分享出去才不會一起外流。
