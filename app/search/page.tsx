import { ProductShell } from "@/components/product-shell";
import { SearchPage } from "@/components/workspaces";

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const params = await searchParams;
  return <ProductShell><SearchPage initialQuery={params.query ?? ""} /></ProductShell>;
}
