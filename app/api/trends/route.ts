import { NextResponse } from "next/server";
import { sampleVideos } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import type { ShortVideo } from "@/lib/types";
import { fetchIndiaShorts } from "@/lib/youtube";

export async function GET(request: Request) {
  const mode = getDataMode();
  const searchParams = new URL(request.url).searchParams;
  const limit = Number(searchParams.get("limit") ?? 50);
  const sort = searchParams.get("sort") as "Hot" | "Popular" | "Latest" | null;
  const format = searchParams.get("format") as "All videos" | "Shorts" | "Long" | null;
  const window = searchParams.get("window") as "24h" | "3d" | "7d" | "14d" | null;
  const language = searchParams.get("language") as "All" | NonNullable<ShortVideo["language"]> | null;
  const category = searchParams.get("category") ?? undefined;
  const signal = searchParams.get("signal") as ShortVideo["label"] | "All signals" | null;
  const query = searchParams.get("q") ?? undefined;
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try {
      return NextResponse.json({ mode, region: "India", format: format ?? "Shorts", updatedAt: new Date().toISOString(), items: await fetchIndiaShorts({ limit, sort: sort ?? "Hot", format: format ?? "Shorts", window: window ?? "7d", language: language ?? "All", category: category ?? "All", signal: signal ?? "All signals", query }) });
    } catch {
      return NextResponse.json({ error: "We couldn't refresh the India signal from YouTube." }, { status: 502 });
    }
  }
  const demoItems = sampleVideos.filter((item) => {
    if (format === "Shorts" && (item.videoKind ?? "Shorts") !== "Shorts") return false;
    if (format === "Long" && (item.videoKind ?? "Shorts") !== "Long") return false;
    if (category && category !== "All" && item.category !== category) return false;
    if (signal && signal !== "All signals" && item.label !== signal) return false;
    return true;
  });
  return NextResponse.json({ mode, region: "India", format: format ?? "Shorts", updatedAt: new Date().toISOString(), items: demoItems.slice(0, Math.max(1, limit || sampleVideos.length)) });
}
