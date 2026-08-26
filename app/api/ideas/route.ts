import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { buildCreatorActionPlan, type CreatorOutputMode } from "@/lib/intelligence/creator-engine";
import type { CreatorProfile } from "@/lib/intelligence/opportunity-engine";
import { generateCreatorIdeas, isOpenAIConfigured } from "@/lib/openai";
import { fetchIndiaShort } from "@/lib/youtube";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { id?: string; brief?: string; outputMode?: CreatorOutputMode; profile?: CreatorProfile };
  let video = getVideo(body.id ?? "short-01");
  const mode = getDataMode();
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try { video = await fetchIndiaShort(body.id ?? "") ?? video; } catch { return NextResponse.json({ error: "Live source evidence is temporarily unavailable." }, { status: 502 }); }
  }
  if (mode === "live" && isOpenAIConfigured()) {
    try { return NextResponse.json({ mode: "live", plan: buildCreatorActionPlan(video, body.profile), ideas: await generateCreatorIdeas(video, { brief: body.brief, outputMode: body.outputMode, profile: body.profile }) }); } catch { return NextResponse.json({ error: "Grounded creator ideas are temporarily unavailable." }, { status: 502 }); }
  }
  const plan = buildCreatorActionPlan(video, body.profile);
  const briefPrefix = body.brief?.trim() ? `For your brief, ` : "";
  const fallbackIdeas = ideasForMode(body.outputMode ?? "Explore", plan, briefPrefix);
  return NextResponse.json({ mode: "demo", plan, ideas: fallbackIdeas });
}

function ideasForMode(outputMode: CreatorOutputMode, plan: ReturnType<typeof buildCreatorActionPlan>, briefPrefix: string) {
  if (outputMode === "Write") return [
    { title: "Hook / 0-3s", rationale: `${briefPrefix}${plan.scriptBeats[0]} Spoken line: "${plan.titleFrames[0]}."` },
    { title: "Setup / 3-8s", rationale: `${plan.scriptBeats[1]} Use on-screen text that names the constraint immediately.` },
    { title: "Payoff / final beat", rationale: `${plan.scriptBeats[3]} End with a continuation prompt instead of a generic follow request.` },
  ];
  if (outputMode === "Optimize") return [
    { title: "Title direction", rationale: `${plan.titleFrames[0]} keeps the topic clear while avoiding a source-copy title.` },
    { title: "Caption and description", rationale: plan.descriptionDraft },
    { title: "Hashtag roles", rationale: plan.hashtags.map((tag) => `${tag}: topic/context`).join(" / ") },
  ];
  if (outputMode === "Review") return [
    { title: "Keep", rationale: plan.hook },
    { title: "Change", rationale: "Move the strongest result, conflict, or proof into the first two seconds." },
    { title: "Remove", rationale: "Remove slow setup, copied wording, and unsupported performance claims." },
  ];
  if (outputMode === "Plan") return [
    { title: "Fast reaction", rationale: `${briefPrefix}${plan.remakeAngles[0]}` },
    { title: "Tutorial", rationale: plan.nicheMechanics[0] },
    { title: "Contrarian take", rationale: plan.remixScripts[1] },
  ];
  return [
    { title: "Opportunity read", rationale: plan.thesis },
    { title: "Best first move", rationale: plan.remakeAngles[0] },
    { title: "Validation test", rationale: plan.validationPlan[0] },
  ];
}
