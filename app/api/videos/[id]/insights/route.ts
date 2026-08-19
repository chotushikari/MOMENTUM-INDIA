import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const video = getVideo(id); return NextResponse.json({ mode: "demo", evidence: { title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour }, interpretation: { why: video.why, hook: "Can you do it with only the constraint?", format: video.format, payoff: "A visible final reveal" } }); }
