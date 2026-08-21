import { ProductShell } from "@/components/product-shell";
import { SearchPage } from "@/components/workspaces";
import { getPageVideoData } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const params = await searchParams;
  const data = await getPageVideoData();
  return <ProductShell><SearchPage initialQuery={params.query ?? ""} initialItems={data.items} sourceMode={data.mode} /></ProductShell>;
}
