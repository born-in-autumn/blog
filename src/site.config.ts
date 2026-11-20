/**
 * The file you're expected to touch. Owner/repo (used for GitHub Pages
 * URLs and the Issues-based comment system) is auto-detected from git
 * remote — see src/lib/repo.ts — so it's not repeated here.
 *
 * `defaultLocale` is only the no-JS/crawler fallback (see the <noscript>
 * rule in BaseLayout.astro) — visitors with JS enabled always get the
 * text matching their browser language, detected client-side.
 */
export const siteConfig = {
  title: "",
  description: "A zero-config static blog with GitHub Issues as comments.",
  author: "Robin",
  defaultLocale: "en" as const,
  bio: {
    en: "Writing about whatever I'm building. Due to limited time, these materials are not yet available in English. Please kindly understand, but I will promptly address this matter as soon as I have the opportunity",
    zh: "这里有我在Rust社区里贡献的所有PR，由于精力原因，我暂时还没有准备英文版本，这里的每一篇文章基本上都只写了个标题，笔记部分更是乱如麻，各种杂七杂八的东西混在一起，不过就这样吧，我暂时没有精力维护这些了，因为我并不打算公开这些东西，只要我自己看得懂就行，未来等我在Rust Compiler的贡献达到下一个阶段时，再来更新吧",
    zhNote: "Due to limited time, these materials are not yet available in English. Please kindly understand, but I will promptly address this matter as soon as I have the opportunity",
  },
  nav: [
    { href: "/blog/", en: "Home", zh: "首页" },
    { href: "/blog/about/", en: "About", zh: "关于" },
    { href: "/blog/notes/", en: "Notes", zh: "笔记" }, // 新增笔记Tab
  ],
  social: {
    github: "https://github.com/born-in-autumn", // e.g. "https://github.com/your-name" (blank hides the link)
    twitter: "",
    email: "1187338299@qq.com",
  },
};
