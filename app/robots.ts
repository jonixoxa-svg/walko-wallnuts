import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/en/admin", "/de/admin", "/en/field", "/de/field", "/en/dashboard", "/de/dashboard", "/en/checkout", "/de/checkout", "/en/order/", "/de/order/"],
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
