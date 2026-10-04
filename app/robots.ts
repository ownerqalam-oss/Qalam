import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, account and form pages - nothing worth indexing.
      disallow: [
        "/admin",
        "/dashboard",
        "/editor",
        "/write",
        "/api/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/complete-profile",
      ],
    },
    sitemap: "https://qalam.ie/sitemap.xml",
  };
}
