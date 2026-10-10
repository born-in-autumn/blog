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
  title: "Blog",
  description: "A zero-config static blog with GitHub Issues as comments.",
  author: "Robin",
  defaultLocale: "en" as const,
  bio: {
    en: "Writing about whatever I'm building.",
    zh: "这里有我在Rust社区里贡献的所有PR，由于精力原因，我没有准备英文版本",
  },
  nav: [
    { href: "/", en: "Home", zh: "首页" },
    { href: "/about", en: "About", zh: "关于" },
    { href: "/notes", en: "Notes", zh: "笔记" }, // 新增笔记Tab
  ],
  social: {
    github: "", // e.g. "https://github.com/your-name" (blank hides the link)
    twitter: "",
    email: "",
  },
};
