import type { Metadata } from "next";
import { ProductShell } from "@/components/product-shell";
import { IdeasPage } from "@/components/workspaces";
import { getPageVideoData } from "@/lib/page-data";
import { getVideo } from "@/lib/demo-data";
import { buildIdeasMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ videoId?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const video = params.videoId ? getVideo(params.videoId) : undefined;
  return buildIdeasMetadata(video);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ videoId?: string }> }) {
  const params = await searchParams;
  const data = await getPageVideoData();
  // If a videoId is passed (e.g. from DeepDive "Make this for my channel"), prefer that video
  const selectedVideo = params.videoId ? getVideo(params.videoId) : null;
  const video = selectedVideo ?? data.items[0];
  return (
    <ProductShell>
      <IdeasPage video={video} sourceMode={data.mode} preselectedVideoId={params.videoId} />
    </ProductShell>
  );
}
