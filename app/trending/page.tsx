import type { Metadata } from "next";
import Script from "next/script";
import { ProductShell } from "@/components/product-shell";
import { TrendingPage } from "@/components/dashboard";
import { getPageVideoData } from "@/lib/page-data";
import { buildTrendingMetadata, itemListJsonLd } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildTrendingMetadata();

export default async function Page() {
  const data = await getPageVideoData();
  const itemList = itemListJsonLd(data.items, "Trending YouTube Shorts in India", "/trending");
  return (
    <ProductShell>
      <Script id="schema-trending-list" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <TrendingPage videos={data.items} sourceMode={data.mode} dataError={data.error} />
    </ProductShell>
  );
}
