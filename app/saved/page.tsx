import type { Metadata } from "next";
import { ProductShell } from "@/components/product-shell";
import { SavedPage } from "@/components/workspaces";
import { buildSavedMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSavedMetadata();

export default function Page() { return <ProductShell><SavedPage /></ProductShell>; }

