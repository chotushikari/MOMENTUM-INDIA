import type { Metadata } from "next";
import { ProductShell } from "@/components/product-shell";
import { IdeasPage } from "@/components/workspaces";
import { getPageVideoData } from "@/lib/page-data";
import { getVideo } from "@/lib/demo-data";
import { buildIdeasMetadata } from "@/lib/seo/metadata";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShort } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ videoId?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const video = params.videoId ? getVideo(params.videoId) : undefined;
  return buildIdeasMetadata(video);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ videoId?: string }> }) {
  const params = await searchParams;
  const data = await getPageVideoData();
  let video = data.items[0];
  if (params.videoId) {
    if (getDataMode() === "live" && isLiveConfigured()) {
      const liveVideo = await fetchIndiaShort(params.videoId).catch(() => null);
      if (liveVideo) video = liveVideo;
      else video = getVideo(params.videoId);
    } else {
      video = getVideo(params.videoId);
    }
  }
  return (
    <ProductShell>
      <IdeasPage video={video} sourceMode={data.mode} preselectedVideoId={params.videoId} />
    </ProductShell>
  );
}
