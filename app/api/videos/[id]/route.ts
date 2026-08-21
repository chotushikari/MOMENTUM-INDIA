import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShort } from "@/lib/youtube";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (getDataMode() === "live" && isLiveConfigured()) {
    try {
      const item = await fetchIndiaShort(id);
      if (item) return NextResponse.json({ mode: "live", item });
    } catch { return NextResponse.json({ error: "YouTube could not refresh this Short." }, { status: 502 }); }
  }
  return NextResponse.json({ mode: "demo", item: getVideo(id) });
}
