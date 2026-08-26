import type { Metadata } from "next";
import Script from "next/script";
import { ProductShell } from "@/components/product-shell";
import { CategoryPage } from "@/components/dashboard";
import { getCategory, sampleVideos } from "@/lib/demo-data";
import { breadcrumbJsonLd, buildCategoryMetadata, itemListJsonLd } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return buildCategoryMetadata(getCategory(slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  const categoryVideos = sampleVideos.filter((v) => v.category === category.name);
  const itemList = itemListJsonLd(categoryVideos, `${category.name} Trending Shorts`, `/categories/${slug}`);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "MOMENTUM", url: "/" },
    { name: "Categories", url: "/categories" },
    { name: category.name, url: `/categories/${slug}` },
  ]);
  return (
    <ProductShell>
      <Script id="schema-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Script id="schema-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <CategoryPage category={category} />
    </ProductShell>
  );
}
