import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { generateCreatorIdeas, isOpenAIConfigured } from "@/lib/openai";
import { fetchIndiaShort } from "@/lib/youtube";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { id?: string };
  let video = getVideo(body.id ?? "short-01");
  const mode = getDataMode();
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try { video = await fetchIndiaShort(body.id ?? "") ?? video; } catch { return NextResponse.json({ error: "Live source evidence is temporarily unavailable." }, { status: 502 }); }
  }
  if (mode === "live" && isOpenAIConfigured()) {
    try { return NextResponse.json({ mode: "live", ideas: await generateCreatorIdeas(video) }); } catch { return NextResponse.json({ error: "Grounded creator ideas are temporarily unavailable." }, { status: 502 }); }
  }
  return NextResponse.json({ mode: "demo", ideas: [{ title: "Make the format local", rationale: "Carry the observed constraint into a location your audience can picture." }, { title: "Change the constraint", rationale: "Adapt the format with a new budget, time, or comparison while keeping the payoff visible." }, { title: "Turn it into a series", rationale: "Repeat the observed structure across three recognizable places or audiences." }] });
}
