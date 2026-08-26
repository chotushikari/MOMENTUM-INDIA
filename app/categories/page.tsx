import type { Metadata } from "next";
import { ProductShell } from "@/components/product-shell";
import { CategoriesPage } from "@/components/dashboard";
import { buildCategoriesMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoriesMetadata();

export default function Page() { return <ProductShell><CategoriesPage /></ProductShell>; }
