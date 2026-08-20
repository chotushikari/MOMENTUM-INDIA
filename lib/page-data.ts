import { sampleVideos } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShorts } from "@/lib/youtube";
import type { ShortVideo, SourceMode } from "@/lib/types";

export type PageVideoData = {
  items: ShortVideo[];
  mode: SourceMode;
  error?: string;
};

export async function getPageVideoData(): Promise<PageVideoData> {
  const mode = getDataMode();
  if (mode === "demo") return { items: sampleVideos, mode };
  if (!isLiveConfigured()) return { items: [], mode, error: "Live YouTube data is not configured." };
  try {
    return { items: await fetchIndiaShorts(), mode };
  } catch {
    return { items: [], mode, error: "YouTube could not refresh the India signal right now." };
  }
}
