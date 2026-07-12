import type { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/email";

export default function sitemap(): MetadataRoute.Sitemap {
  const portalBaseUrl = getPortalBaseUrl();

  return [
    {
      url: portalBaseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
