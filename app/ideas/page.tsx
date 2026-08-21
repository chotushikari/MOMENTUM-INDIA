import { ProductShell } from "@/components/product-shell";
import { IdeasPage } from "@/components/workspaces";
import { getPageVideoData } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getPageVideoData();
  return <ProductShell><IdeasPage video={data.items[0]} sourceMode={data.mode} /></ProductShell>;
}
