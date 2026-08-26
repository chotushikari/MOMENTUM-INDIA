import { NextResponse } from "next/server";
import { sampleVideos } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import type { ShortVideo, TrendScanMeta } from "@/lib/types";
import { fetchIndiaTrendScan } from "@/lib/youtube";

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
  const scanner = { sort: sort ?? "Hot", format: format ?? "Shorts", window: window ?? "7d", language: language ?? "All", category: category ?? "All", signal: signal ?? "All signals", taxonomy: "ai-with-rule-fallback" };
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try {
      const scan = await fetchIndiaTrendScan({ limit, sort: sort ?? "Hot", format: format ?? "Shorts", window: window ?? "7d", language: language ?? "All", category: category ?? "All", signal: signal ?? "All signals", query });
      return NextResponse.json({ mode, region: "India", format: format ?? "Shorts", updatedAt: new Date().toISOString(), scanner, meta: scan.meta, items: scan.items });
    } catch {
      return NextResponse.json({ error: "We couldn't refresh the India signal from YouTube." }, { status: 502 });
    }
  }
  const demoItems = sampleVideos.filter((item) => {
    if (format === "Shorts" && (item.videoKind ?? "Shorts") !== "Shorts") return false;
    if (format === "Long" && (item.videoKind ?? "Shorts") !== "Long") return false;
    if (language && language !== "All" && item.language && item.language !== language) return false;
    if (category && category !== "All" && item.category !== category) return false;
    if (signal && signal !== "All signals" && item.label !== signal) return false;
    if (query && !`${item.title} ${item.topic} ${item.category} ${item.format}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const requestedLimit = Math.max(1, limit || sampleVideos.length);
  const returned = demoItems.slice(0, requestedLimit);
  const meta: TrendScanMeta = {
    candidatePool: sampleVideos.length,
    exactMatches: demoItems.length,
    returned: returned.length,
    requestedLimit,
    sourceRequests: 0,
    matchMode: "exact",
    effectiveWindow: window ?? "7d",
    rankingScope: "Ranked within sample fixtures. Demo data is not a live YouTube-wide claim.",
    retrievedCount: sampleVideos.length,
    enrichedCount: sampleVideos.length,
    matchedCount: demoItems.length,
    shownCount: returned.length,
    coverageWindow: window ?? "7d",
    retrievedAt: new Date().toISOString(),
    rankingMethod: sort === "Latest" ? "Latest first, then freshness and confidence" : sort === "Popular" ? "Reach first, then momentum" : "Momentum first, then velocity, reach, freshness, confidence",
    sources: ["Sample fixture"],
    coverageConfidence: demoItems.length >= 8 ? "Medium" : "Low",
    signalConfidence: demoItems.length >= 8 ? "Medium" : "Low",
    cacheHit: false,
    filterBreakdown: { candidates: sampleVideos.length, format: demoItems.length, language: demoItems.length, category: demoItems.length, signal: demoItems.length },
  };
  return NextResponse.json({ mode, region: "India", format: format ?? "Shorts", updatedAt: new Date().toISOString(), scanner, meta, items: returned });
}
