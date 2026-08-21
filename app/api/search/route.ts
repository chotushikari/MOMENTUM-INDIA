import { NextResponse } from "next/server";
import { sampleVideos } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShorts } from "@/lib/youtube";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (getDataMode() === "live" && isLiveConfigured() && query) {
    try {
      const items = await fetchIndiaShorts({ limit: 30, sort: "Hot", format: "All videos", window: "14d", language: "All", category: "All", query });
      return NextResponse.json({ mode: "live", query, items });
    } catch {
      return NextResponse.json({ error: "Search could not refresh YouTube right now." }, { status: 502 });
    }
  }
  const items = query ? sampleVideos.filter((video) => `${video.title} ${video.topic} ${video.category}`.toLowerCase().includes(query.toLowerCase())) : [];
  return NextResponse.json({ mode: "demo", query, items });
}
