import { NextResponse } from "next/server";
import { categories } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import type { Category, ShortVideo } from "@/lib/types";
import { fetchIndiaShorts } from "@/lib/youtube";

export async function GET() {
  if (getDataMode() === "live" && isLiveConfigured()) {
    try {
      const videos = await fetchIndiaShorts({ limit: 50, sort: "Hot", format: "All videos", window: "7d", language: "All", category: "All" });
      return NextResponse.json({ mode: "live", region: "India", items: categoriesFromVideos(videos) });
    } catch {
      return NextResponse.json({ error: "Categories could not refresh YouTube right now." }, { status: 502 });
    }
  }
  return NextResponse.json({ mode: "demo", region: "India", items: categories });
}

function categoriesFromVideos(videos: ShortVideo[]): Category[] {
  const byName = new Map<string, ShortVideo[]>();
  for (const video of videos) {
    const key = video.category || "Other";
    byName.set(key, [...(byName.get(key) ?? []), video]);
  }
  const seeded = new Map(categories.map((category) => [category.name, category]));
  return Array.from(byName.entries()).map(([name, items]) => {
    const seed = seeded.get(name);
    const topics = Array.from(new Set(items.map((item) => item.topic).filter(Boolean))).slice(0, 3);
    const momentum = Math.round(items.reduce((sum, item) => sum + item.momentumScore, 0) / Math.max(items.length, 1));
    return {
      slug: seed?.slug ?? slugify(name),
      name,
      description: seed?.description ?? `Fresh ${name.toLowerCase()} videos classified from the current India scan.`,
      color: seed?.color ?? "#b7f27b",
      momentum,
      videoCount: items.length,
      subtopics: topics.map((topic) => ({ name: topic, change: "Live", status: items.find((item) => item.topic === topic)?.label ?? "Emerging" })),
    };
  }).sort((a, b) => b.momentum - a.momentum);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
}
