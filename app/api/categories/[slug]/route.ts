import { NextResponse } from "next/server";
import { getCategory } from "@/lib/demo-data";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return NextResponse.json({ mode: "demo", item: getCategory(slug) }); }
