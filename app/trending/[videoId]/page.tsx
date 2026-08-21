import { ProductShell } from "@/components/product-shell";
import { DeepDivePage } from "@/components/workspaces";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShort } from "@/lib/youtube";

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const demoVideo = getVideo(videoId);
  const video = getDataMode() === "live" && isLiveConfigured() ? await fetchIndiaShort(videoId).catch(() => null) : null;
  return <ProductShell><DeepDivePage video={video ?? demoVideo} /></ProductShell>;
}
