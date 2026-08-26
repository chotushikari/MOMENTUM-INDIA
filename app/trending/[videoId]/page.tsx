import type { Metadata } from "next";
import Script from "next/script";
import { ProductShell } from "@/components/product-shell";
import { DeepDivePage } from "@/components/workspaces";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { fetchIndiaShort } from "@/lib/youtube";
import { buildVideoMetadata, breadcrumbJsonLd, videoObjectJsonLd } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ videoId: string }> }): Promise<Metadata> {
  const { videoId } = await params;
  const demoVideo = getVideo(videoId);
  const video = getDataMode() === "live" && isLiveConfigured() ? await fetchIndiaShort(videoId).catch(() => null) : null;
  return buildVideoMetadata(video ?? demoVideo);
}

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const demoVideo = getVideo(videoId);
  const video = getDataMode() === "live" && isLiveConfigured() ? await fetchIndiaShort(videoId).catch(() => null) : null;
  const resolved = video ?? demoVideo;
  const breadcrumbs = breadcrumbJsonLd([
    { name: "MOMENTUM", url: "/" },
    { name: "Trending", url: "/trending" },
    { name: resolved.title, url: `/trending/${resolved.id}` },
  ]);
  return (
    <ProductShell>
      <Script id="schema-video" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectJsonLd(resolved)) }} />
      <Script id="schema-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <DeepDivePage video={resolved} />
    </ProductShell>
  );
}
