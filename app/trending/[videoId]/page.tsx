import { ProductShell } from "@/components/product-shell";
import { DeepDivePage } from "@/components/workspaces";
import { getVideo } from "@/lib/demo-data";

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  return <ProductShell><DeepDivePage video={getVideo(videoId)} /></ProductShell>;
}
