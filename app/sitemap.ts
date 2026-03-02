import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://relayprm.com",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://relayprm.com/app",
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: "https://relayprm.com/portal",
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
