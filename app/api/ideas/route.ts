import { NextResponse } from "next/server";
import { getVideo } from "@/lib/demo-data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { buildCreatorActionPlan } from "@/lib/intelligence/creator-engine";
import { generateCreatorIdeas, isOpenAIConfigured } from "@/lib/openai";
import { fetchIndiaShort } from "@/lib/youtube";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { id?: string; brief?: string; outputMode?: "Strategy" | "Script" | "Metadata" | "Remix" };
  let video = getVideo(body.id ?? "short-01");
  const mode = getDataMode();
  if (mode === "live") {
    if (!isLiveConfigured()) return NextResponse.json({ error: "Live YouTube data is not configured." }, { status: 503 });
    try { video = await fetchIndiaShort(body.id ?? "") ?? video; } catch { return NextResponse.json({ error: "Live source evidence is temporarily unavailable." }, { status: 502 }); }
  }
  if (mode === "live" && isOpenAIConfigured()) {
    try { return NextResponse.json({ mode: "live", plan: buildCreatorActionPlan(video), ideas: await generateCreatorIdeas(video, { brief: body.brief, outputMode: body.outputMode }) }); } catch { return NextResponse.json({ error: "Grounded creator ideas are temporarily unavailable." }, { status: 502 }); }
  }
  const plan = buildCreatorActionPlan(video);
  const briefPrefix = body.brief?.trim() ? `For your brief, ` : "";
  const fallbackIdeas = body.outputMode === "Script"
    ? [{ title: "Opening beat", rationale: `${briefPrefix}${plan.scriptBeats[0]} ${plan.scriptBeats[1]}` }, { title: "Proof beat", rationale: plan.scriptBeats[2] }, { title: "Closing beat", rationale: plan.scriptBeats[3] }]
    : body.outputMode === "Metadata"
      ? [{ title: plan.titleFrames[0], rationale: plan.descriptionDraft }, { title: "Hashtag pack", rationale: plan.hashtags.join(" ") }, { title: "Thumbnail packaging", rationale: plan.thumbnailDirection }]
      : body.outputMode === "Remix"
        ? plan.remixScripts.map((script, index) => ({ title: `Remix ${index + 1}`, rationale: script }))
        : [{ title: plan.titleFrames[0], rationale: `${briefPrefix}${plan.remakeAngles[0]}` }, { title: plan.titleFrames[1], rationale: plan.nicheMechanics.join(" ") }, { title: plan.titleFrames[2], rationale: `${plan.thumbnailDirection} ${plan.validationPlan[0]}` }];
  return NextResponse.json({ mode: "demo", plan, ideas: fallbackIdeas });
}
