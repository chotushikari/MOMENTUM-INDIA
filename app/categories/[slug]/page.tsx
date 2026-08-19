import { ProductShell } from "@/components/product-shell";
import { CategoryPage } from "@/components/dashboard";
import { getCategory } from "@/lib/demo-data";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductShell><CategoryPage category={getCategory(slug)} /></ProductShell>;
}
