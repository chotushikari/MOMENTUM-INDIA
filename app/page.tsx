import { ProductShell } from "@/components/product-shell";
import { HomePage } from "@/components/dashboard";
import { getPageVideoData } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getPageVideoData();
  return <ProductShell><HomePage videos={data.items} sourceMode={data.mode} dataError={data.error} /></ProductShell>;
}
