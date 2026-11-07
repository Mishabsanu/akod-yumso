import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-11-07"),
      changeFrequency: "weekly",
      priority: 1,
      images: [`${SITE_URL}/lineup.jpeg`, ...products.map((p) => `${SITE_URL}${p.image}`)],
    },
  ];
}
