import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private pages. Auth pages (login, signup, ...) are deliberately not
      // listed: they carry a noindex tag, which crawlers can only see if
      // they're allowed to fetch the page.
      disallow: ["/admin", "/dashboard", "/editor", "/write", "/api/"],
    },
    sitemap: "https://qalam.ie/sitemap.xml",
  };
}
