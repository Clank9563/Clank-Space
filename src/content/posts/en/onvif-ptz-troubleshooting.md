---
title: ONVIF troubleshooting
description: While controlling a PTZ camera with Python's onvif-zeep, Media1 GetProfiles kept failing, and without a ProfileToken the camera can't move. This post walks through six troubleshooting steps and shows how to call Media2 with hand-built SOAP to work around the problem.
date: 2026-11-20
category: network
tags: [ONVIF, Python, PTZ, SOAP]
translationKey: onvif-ptz-troubleshooting
---

I was using the Python package `onvif-zeep` to control a PTZ (Pan-Tilt-Zoom) camera, and the Media1 service's `GetProfiles` call kept failing. PTZ commands need a `ProfileToken`, so without one the camera won't move. This post follows the six steps of the investigation in order; each step rules out one class of causes.

| Step | What is checked | Problem ruled out |
| --- | --- | --- |
| 1 | Connectivity, credentials, privilege level | Network / port / credentials / privileges |
| 2 | UTC time offset between camera and PC | Authentication failures caused by clock drift |
| 3 | Package `xaddrs` vs. camera `GetServices` | Wrong service URLs, services missed by the package |
| 4 | Testing Media1 / PTZ calls one by one | Which service is broken and which works |
| 5 | Calling Media2 `GetProfiles` with hand-built SOAP | Bypassing the broken Media1 to get a ProfileToken |
| 6 | Reading PTZ status and presets with the ProfileToken | Verifying the token; telling the three token types apart |

Replace `IP`, `USER`, and `PASS` in the examples with real values. Every token starting with `TEST_` is a placeholder.

## Step 1: Connectivity, credentials, and privileges

```python
camera = ONVIFCamera(IP, 80, USER, PASS)          # fetch the service list
info = camera.devicemgmt.GetDeviceInformation()   # requires authentication
users = camera.devicemgmt.GetUsers()              # requires authentication; lists user levels
```

If `ONVIFCamera(...)` itself fails, the cause is usually at the network layer: wrong IP or the camera is off, wrong port (not necessarily 80), or a firewall or router in the way. A few cameras already check credentials at this step, so wrong credentials can also fail here.

The error message tells you which:

- `timeout`, `Connection refused`: network problem
- `NotAuthorized`, `401`: credential problem

ONVIF has only three user levels:

| Level | Allowed actions |
| --- | --- |
| Administrator | Everything, including changing settings and managing users |
| Operator | Operational actions; **the minimum level for PTZ movement** |
| User | View video only |

For example, `test_operator` is an Operator (for PTZ control) and `test_viewer` is a User (stream viewing only). I was using an Administrator account, so privileges weren't the problem.

## Step 2: Check time synchronization

```python
dt = camera.devicemgmt.GetSystemDateAndTime()
d, t = dt.UTCDateTime.Date, dt.UTCDateTime.Time
cam_time = datetime.datetime(d.Year, d.Month, d.Day, t.Hour, t.Minute, t.Second,
                             tzinfo=datetime.timezone.utc)
pc_time = datetime.datetime.now(datetime.timezone.utc)
print("Offset (seconds):", abs((pc_time - cam_time).total_seconds()))
```

Always compare in UTC. UTC has no time zones or daylight saving, and ONVIF requires authentication timestamps in UTC. Comparing against Taiwan local time (UTC+8) creates a false 8-hour offset.

When the offset is too large (say, 10 minutes), the first call to fail is usually `GetDeviceInformation()`, because `ONVIFCamera(...)` usually doesn't require authentication. The error is `NotAuthorized / Sender not authorized`, **exactly the same as a wrong password**, so time has to be checked on its own. How large an offset triggers the failure depends on the camera's implementation.

## Step 3: Compare service addresses

```python
# Method A: addresses assembled by the package
for name, url in camera.xaddrs.items(): print(name, url)

# Method B: ask the camera directly
for s in camera.devicemgmt.GetServices({"IncludeCapability": False}):
    print(s.Namespace, s.XAddr)
```

If the camera reports XAddrs with a private (LAN) IP, they're unreachable from outside and you need to rewrite `xaddrs`. This camera reported a public IP, so nothing needed to change.

This camera has two Media services:

| Namespace | URL | Description |
| --- | --- | --- |
| `ver10/media/wsdl` | `/onvif/media_service` | Media1 (legacy) |
| `ver20/media/wsdl` | `/onvif/media2_service` | Media2 (newer, mainly for newer codecs such as H.265) |

The key finding: Method A had no `media2_service`, but Method B did. `onvif-zeep` doesn't recognize Media2 and silently drops it, so Media2 has to be queried with hand-built SOAP.

## Step 4: Test calls one by one

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

This was the turning point of the whole investigation: **the PTZ calls succeeded, but Media1 `GetProfiles` failed.**

That means the PTZ service itself is healthy and movement isn't broken; the only missing piece is the `ProfileToken` parameter. Get the token another way and the camera will move. Media2 is an independent service, so Media1 being broken doesn't mean Media2 is too. That's where to get the token instead.

I didn't find the root cause of the Media1 failure.

## Step 5: Call Media2 with hand-built SOAP

`onvif-zeep` has no `create_media2_service()`, so you have to build the SOAP request yourself and send it with `requests`. A SOAP message looks like this:

```
Envelope
 ├─ Header   ← authentication (WS-Security UsernameToken)
 └─ Body     ← the operation to call (GetProfiles)
```

The password in the Header is sent as a Digest:

```
Digest = Base64( SHA1( Nonce + Created + Password ) )
```

- `Nonce`: 16 random bytes
- `Created`: the current UTC time, which is why Step 2 checks time sync first

```python
nonce = os.urandom(16)
created = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
digest = base64.b64encode(hashlib.sha1(nonce + created.encode() + PASS.encode()).digest()).decode()

# Body:
# <tr2:GetProfiles><tr2:Type>All</tr2:Type></tr2:GetProfiles>
# where xmlns:tr2="http://www.onvif.org/ver20/media/wsdl"

r = requests.post(f"http://{IP}/onvif/media2_service", data=soap,
                  headers={"Content-Type": "application/soap+xml"}, timeout=10)
```

`soap` is the full XML that puts the Header and Body above together; it's omitted here.

### Why the Nonce must be random every time

To prevent replay attacks. With a fixed Nonce, someone who intercepts a login request could resend it unchanged. With a different Nonce each time, and the camera rejecting values it has already seen, a stolen request is useless. Think of it as a one-time code.

### Finding the token in the response

Look for the outermost `<tr2:Profiles token="...">`; the `<tr2:Name>` beneath it is the profile name:

| Token | Name |
| --- | --- |
| `TEST_PROFILE_A` | Max view |
| `TEST_PROFILE_B` | Recording |
| `TEST_PROFILE_C` | Live view |

Each profile contains `<tr2:PTZ token="TEST_PTZ_CONFIG">`, meaning it has a PTZ configuration bound to it, so any of the three can be used for movement. I picked `TEST_PROFILE_A`.

### Using HTTP status codes to decide where to look

| Result | Meaning | Go back and check |
| --- | --- | --- |
| `401 Unauthorized` | Authentication problem | Step 1 credentials / privileges, **Step 2 clock offset (most often overlooked)** |
| `404 Not Found` / SOAP Fault | Wrong URL or namespace | Step 3 service addresses |

## Step 6: Verify the token and list presets

```python
ptz = camera.create_ptz_service()
PROFILE_TOKEN = "TEST_PROFILE_A"

status = ptz.GetStatus({"ProfileToken": PROFILE_TOKEN})   # position readable = token valid
print(status.Position.PanTilt.x, status.Position.PanTilt.y)

for p in ptz.GetPresets({"ProfileToken": PROFILE_TOKEN}):
    print(p.token, "→", p.Name)
```

I also tried using the token of the PTZ block inside a profile as the ProfileToken. It doesn't work:

```
OK   TEST_PROFILE_A   → position read: 0.xx
FAIL TEST_PTZ_CONFIG  → The requested profile token ProfileToken does not exist.
FAIL abc              → The requested profile token ProfileToken does not exist.
```

A wrong token returns a SOAP Fault saying the profile doesn't exist.

### A profile is like a folder

```
TEST_PROFILE_A                ← ProfileToken (the folder)
 ├─ VideoSource   token="TEST_VSRC_CONFIG"
 ├─ VideoEncoder  token="TEST_VENC_CONFIG"
 ├─ AudioEncoder  token="TEST_AENC_CONFIG"
 └─ PTZ           token="TEST_PTZ_CONFIG"   ← PTZConfigurationToken (a file in the folder)
```

Only the outermost `<tr2:Profiles token="...">` in the XML is the ProfileToken; anything nested inside is something else.

### Three kinds of token

| Name | Source | Example | Purpose |
| --- | --- | --- | --- |
| ProfileToken | Media2 `GetProfiles` | `TEST_PROFILE_A` | Selects which profile to operate the camera with |
| PresetToken | `p.token` from `GetPresets` | `TEST_PRESET_01` | Selects which preset to move to |
| PTZConfigurationToken | PTZ block inside a profile | `TEST_PTZ_CONFIG` | PTZ configuration; not needed for movement |

Presets also have both a `token` and a `Name`. The `token` is the camera's internal identifier, and it's what API calls must pass. The `Name` (e.g. `Preset001`) is a human-readable label you can change in the web interface; it can't be used in calls.

### The final call

```python
ptz.GotoPreset({
    "ProfileToken": "TEST_PROFILE_A",  # which profile to use
    "PresetToken":  "TEST_PRESET_01",  # which preset to go to
})
```

## Quick reference

1. When you can't connect, first tell network problems (`timeout` / `Connection refused`) from authentication problems (`401` / `NotAuthorized`).
2. PTZ movement needs at least Operator privileges.
3. Authentication fails but the credentials are definitely right: check the UTC clock offset.
4. `onvif-zeep` doesn't support Media2, so `xaddrs` omits `media2_service`; confirm with `GetServices`.
5. When Media1 `GetProfiles` is broken, send SOAP to Media2 by hand to get the ProfileToken.
6. `GotoPreset` needs two tokens: the ProfileToken and the PresetToken. Not the preset's Name, and not the PTZConfigurationToken.

One last reminder: don't hard-code the password in your scripts. Pass it in through an environment variable or similar, so it doesn't leak when you share the code.
