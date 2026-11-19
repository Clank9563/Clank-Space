// 網站的個人資料都集中在這裡。目前全部是範例內容，請換成你自己的。
export const site = {
  /** 還在用範例內容時設成 true，頁面會顯示「範例內容」標記；換成真實資料後改成 false */
  placeholder: false,
  /** 網站名稱：頁首左上角「冊名」、瀏覽器分頁標題、RSS 名稱 */
  title: { zh: "Clank 的工程筆記", en: "Clank's Engineering Notebook" },
  /** 中文版冊名下方的英文小字 */
  titleSub: "Engineering Notebook",
  name: { zh: "Clank", en: "Clank" },
  role: { zh: "軟體工程師", en: "Software Engineer" },
  location: { zh: "台中", en: "Taichung" },
  /** 筆記本冊號，出現在頁首「Book / Page」欄位 */
  book: "No. 1",
  email: "you@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com/your-account" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-account" },
  ],
  /**
   * Giscus 留言設定：到 https://giscus.app 產生後填入。
   * repoId 留空時不會顯示留言區。
   */
  giscus: {
    repo: "Clank9563/Clank-Space",
    repoId: "R_kgDOVzvAuQ",
    category: "Announcements",
    categoryId: "DIC_kwDOVzvAuc4DLdxD",
  },
  /**
   * GoatCounter 訪客人次：到 https://www.goatcounter.com 註冊後，把網站代碼填在 code
   * （例如網址是 https://myname.goatcounter.com，code 就是 'myname'），
   * 並在 GoatCounter 的 Settings 勾選「Allow adding visitor counts on your website」。
   * code 留空時不會記錄，網站上也不會顯示次數。
   */
  goatcounter: {
    code: "clank9563",
  },
  /** 分類：key 用在網址，label 是顯示名稱 */
  categories: {
    cloud: { zh: "雲端", en: "Cloud" },
    backend: { zh: "後端", en: "Backend" },
    frontend: { zh: "前端", en: "Frontend" },
    network: { zh: "網路", en: "Networking" },
    devops: { zh: "DevOps", en: "DevOps" },
    database: { zh: "資料庫", en: "Database" },
    security: { zh: "資安", en: "Security" },
    ai: { zh: "AI", en: "AI" },
  },
} as const;

export type CategoryKey = keyof typeof site.categories;
