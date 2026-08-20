import { ProductShell } from "@/components/product-shell";
import { TrendingPage } from "@/components/dashboard";
import { getPageVideoData } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function TrendingSoundsPage() {
  const data = await getPageVideoData();
  return <ProductShell><TrendingPage videos={data.items} sourceMode={data.mode} dataError={data.error} /></ProductShell>;
}
