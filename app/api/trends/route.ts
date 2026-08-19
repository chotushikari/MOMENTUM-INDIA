import { NextResponse } from "next/server";
import { sampleVideos } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShorts } from "@/lib/youtube";

export async function GET() {
  const mode = getDataMode();
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try {
      return NextResponse.json({ mode, region: "India", format: "YouTube Shorts", updatedAt: new Date().toISOString(), items: await fetchIndiaShorts() });
    } catch {
      return NextResponse.json({ error: "We couldn't refresh the India signal from YouTube." }, { status: 502 });
    }
  }
  return NextResponse.json({ mode, region: "India", format: "YouTube Shorts", updatedAt: new Date().toISOString(), items: sampleVideos });
}
