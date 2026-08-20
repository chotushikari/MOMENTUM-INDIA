import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode } from "@/lib/data-mode";
import { generateGroundedInsight, isOpenAIConfigured } from "@/lib/openai";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = getVideo(id);
  const evidence = { title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour };
  if (getDataMode() === "live" && isOpenAIConfigured()) {
    try { return NextResponse.json({ mode: "live", evidence, interpretation: await generateGroundedInsight(video) }); } catch { return NextResponse.json({ mode: "live", evidence, error: "Grounded intelligence is temporarily unavailable." }, { status: 502 }); }
  }
  return NextResponse.json({ mode: "demo", evidence, interpretation: { why: video.why, hook: "Can you do it with only the constraint?", format: video.format, payoff: "A visible final reveal" } });
}
