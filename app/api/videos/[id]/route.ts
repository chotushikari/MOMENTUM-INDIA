import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ mode: "demo", item: getVideo(id) }); }
