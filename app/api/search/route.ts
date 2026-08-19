import { NextResponse } from "next/server";
import { sampleVideos } from "@/lib/demo-data";

export function GET(request: Request) { const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""; const items = query ? sampleVideos.filter((video) => `${video.title} ${video.topic} ${video.category}`.toLowerCase().includes(query.toLowerCase())) : []; return NextResponse.json({ mode: "demo", query, items }); }
