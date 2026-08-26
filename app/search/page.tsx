import type { Metadata } from "next";
import { ProductShell } from "@/components/product-shell";
import { SearchPage } from "@/components/workspaces";
import { getPageVideoData } from "@/lib/page-data";
import { buildSearchMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ query?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  return buildSearchMetadata(params.query);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const params = await searchParams;
  const data = await getPageVideoData();
  return <ProductShell><SearchPage initialQuery={params.query ?? ""} initialItems={data.items} sourceMode={data.mode} /></ProductShell>;
}
