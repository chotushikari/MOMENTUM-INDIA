import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import type { ShortVideo } from "@/lib/types";
import { fetchIndiaShort, fetchRelatedVideos } from "@/lib/youtube";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const limit = Number(searchParams.get("limit") ?? 24);
  const format = searchParams.get("format") as "All videos" | "Shorts" | "Long" | null;
  const language = searchParams.get("language") as "All" | NonNullable<ShortVideo["language"]> | null;
  const window = searchParams.get("window") as "24h" | "3d" | "7d" | "14d" | null;
  const sort = searchParams.get("sort") as "Hot" | "Popular" | "Latest" | null;

  if (getDataMode() === "live" && isLiveConfigured()) {
    try {
      const video = await fetchIndiaShort(id);
      if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
      return NextResponse.json({ mode: "live", items: await fetchRelatedVideos(video, { limit, format: format ?? video.videoKind ?? "Shorts", language: language ?? "All", window: window ?? "14d", sort: sort ?? "Hot" }) });
    } catch {
      return NextResponse.json({ error: "YouTube could not retrieve similar videos." }, { status: 502 });
    }
  }

  const video = getVideo(id);
  const items = [video, ...[]];
  const related = items.concat(getDemoRelated(video)).filter((item, index, list) => item.id !== id && list.findIndex((candidate) => candidate.id === item.id) === index);
  return NextResponse.json({ mode: "demo", items: related.slice(0, Math.max(1, limit)) });
}

function getDemoRelated(video: ShortVideo): ShortVideo[] {
  return [getVideo("short-01"), getVideo("short-02"), getVideo("short-03"), getVideo("short-04"), getVideo("short-05"), getVideo("short-06")].filter((item) => item.category === video.category || item.topic === video.topic || item.id !== video.id);
}
