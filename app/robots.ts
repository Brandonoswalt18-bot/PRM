import type { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app", "/portal", "/auth/", "/invite/"],
    },
    sitemap: `${getPortalBaseUrl()}/sitemap.xml`,
  };
}
