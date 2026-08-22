import type { ShortVideo } from "@/lib/types";
import { buildCreatorActionPlan, type CreatorActionPlan } from "@/lib/intelligence/creator-engine";

type ResponsePayload = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
export type GroundedInsight = { why: string; hook: string; format: string; payoff: string; creatorPlan?: CreatorActionPlan };
export type CreatorIdea = { title: string; rationale: string };
export type VideoTaxonomy = { id: string; category: string; topic: string; format: string; reason: string };

export function isOpenAIConfigured(): boolean { return Boolean(process.env.OPENAI_API_KEY); }

function outputText(payload: ResponsePayload): string {
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").join("") ?? "";
}

async function requestOpenAI(input: string, maxOutputTokens: number): Promise<ResponsePayload> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(25_000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", input, max_output_tokens: maxOutputTokens }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  return response.json() as Promise<ResponsePayload>;
}

function jsonText(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed;
}

export async function checkOpenAI(): Promise<{ reachable: boolean; model: string }> {
  const payload = await requestOpenAI("Reply with the single word READY.", 16);
  return { reachable: outputText(payload).trim().length > 0, model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini" };
}

export async function generateGroundedInsight(video: ShortVideo): Promise<GroundedInsight> {
  const fallbackPlan = buildCreatorActionPlan(video);
  const evidence = JSON.stringify({ title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour, engagement: video.engagement, momentumScore: video.momentumScore, evidenceScore: video.evidenceScore, rankConfidence: video.rankConfidence, rankReason: video.rankReason, durationSeconds: video.durationSeconds, videoKind: video.videoKind, language: video.language, category: video.category, topic: video.topic, format: video.format });
  const payload = await requestOpenAI(`You are MOMENTUM's grounded video strategist. Use only this observed evidence: ${evidence}. Do not invent metrics, audience demographics, performance history, location/city data, or claims not present in evidence. Return strict JSON with fields: why, hook, format, payoff, creatorPlan. creatorPlan must include thesis, audience, nicheMechanics array of 3, hook, format, payoff, remakeAngles array of 3, titleFrames array of 4, scriptBeats array of 4, remixScripts array of 3, hashtags array of 6, descriptionDraft, thumbnailDirection, riskChecks array of 3, validationPlan array of 3, postingChecklist array of 4. Make the plan useful for creating a high-performing but original video.`, 1300);
  const text = jsonText(outputText(payload));
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("OpenAI returned an invalid insight shape");
  const candidate = parsed as Partial<GroundedInsight>;
  if (![candidate.why, candidate.hook, candidate.format, candidate.payoff].every((value) => typeof value === "string" && value.trim())) throw new Error("OpenAI returned incomplete grounded insight");
  const why = candidate.why as string;
  const hook = candidate.hook as string;
  const format = candidate.format as string;
  const payoff = candidate.payoff as string;
  return { why, hook, format, payoff, creatorPlan: normalizeCreatorPlan(candidate.creatorPlan, fallbackPlan) };
}

export async function generateCreatorIdeas(video: ShortVideo, request: { brief?: string; outputMode?: string } = {}): Promise<CreatorIdea[]> {
  const plan = buildCreatorActionPlan(video);
  const evidence = JSON.stringify({ title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour, engagement: video.engagement, rankConfidence: video.rankConfidence, category: video.category, topic: video.topic, format: video.format, userBrief: request.brief, requestedOutput: request.outputMode, plan });
  const payload = await requestOpenAI(`You are MOMENTUM's grounded creator strategist. Use only this observed evidence: ${evidence}. Do not invent metrics, audience behavior, or trend history. The user requested ${request.outputMode ?? "Strategy"}. Return strict JSON with an ideas array containing exactly three objects, each with a short title and one-sentence rationale. Each idea must adapt the observed format into an original video concept with a strong hook, clear viewer payoff, and creator-safe execution. If the request is Script, focus on beats and spoken hooks. If Metadata, focus on title/description/hashtag packaging. If Remix, focus on original remixes of the same mechanic. Mention only things supported by the evidence and supplied plan.`, 560);
  const text = jsonText(outputText(payload));
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { ideas?: unknown }).ideas)) throw new Error("OpenAI returned an invalid idea shape");
  const ideas = (parsed as { ideas: unknown[] }).ideas.filter((item): item is CreatorIdea => Boolean(item) && typeof item === "object" && typeof (item as CreatorIdea).title === "string" && typeof (item as CreatorIdea).rationale === "string");
  if (ideas.length !== 3) throw new Error("OpenAI returned incomplete creator ideas");
  return ideas;
}

function normalizeCreatorPlan(value: unknown, fallback: CreatorActionPlan): CreatorActionPlan {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<CreatorActionPlan>;
  return {
    thesis: stringOr(candidate.thesis, fallback.thesis),
    audience: stringOr(candidate.audience, fallback.audience),
    nicheMechanics: stringArrayOr(candidate.nicheMechanics, fallback.nicheMechanics, 3),
    hook: stringOr(candidate.hook, fallback.hook),
    format: stringOr(candidate.format, fallback.format),
    payoff: stringOr(candidate.payoff, fallback.payoff),
    remakeAngles: stringArrayOr(candidate.remakeAngles, fallback.remakeAngles, 3),
    titleFrames: stringArrayOr(candidate.titleFrames, fallback.titleFrames, 4),
    scriptBeats: stringArrayOr(candidate.scriptBeats, fallback.scriptBeats, 4),
    remixScripts: stringArrayOr(candidate.remixScripts, fallback.remixScripts, 3),
    hashtags: stringArrayOr(candidate.hashtags, fallback.hashtags, 6),
    descriptionDraft: stringOr(candidate.descriptionDraft, fallback.descriptionDraft),
    thumbnailDirection: stringOr(candidate.thumbnailDirection, fallback.thumbnailDirection),
    riskChecks: stringArrayOr(candidate.riskChecks, fallback.riskChecks, 3),
    validationPlan: stringArrayOr(candidate.validationPlan, fallback.validationPlan, 3),
    postingChecklist: stringArrayOr(candidate.postingChecklist, fallback.postingChecklist, 4),
  };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringArrayOr(value: unknown, fallback: string[], count: number): string[] {
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, count);
  return strings.length === count ? strings : fallback;
}

export async function generateVideoTaxonomyBatch(videos: ShortVideo[]): Promise<VideoTaxonomy[]> {
  const evidence = videos.slice(0, 24).map((video) => ({
    id: video.id,
    title: video.title,
    channel: video.channel,
    durationSeconds: video.durationSeconds,
    descriptionHint: video.why,
    existingCategory: video.category,
    existingTopic: video.topic,
    existingFormat: video.format,
  }));
  const payload = await requestOpenAI(`You are MOMENTUM's taxonomy classifier for Indian YouTube results. Use only the supplied observed fields. Return strict JSON with a "videos" array. Each object must include: id, category, topic, format, reason. Category must be one of: Gaming, AI & Tech, Entertainment, Music, Food, Fitness, Education, Finance, Travel, Beauty & Fashion, Sports, News, Devotional, Other. Topic and format should be short professional labels. Do not invent metrics or local/city data. Evidence: ${JSON.stringify(evidence)}`, 1600);
  const text = jsonText(outputText(payload));
  const parsed: unknown = JSON.parse(text);
  const items = (parsed as { videos?: unknown[] }).videos;
  if (!Array.isArray(items)) throw new Error("OpenAI returned invalid taxonomy shape");
  return items.filter((item): item is VideoTaxonomy => Boolean(item) && typeof item === "object" && typeof (item as VideoTaxonomy).id === "string" && typeof (item as VideoTaxonomy).category === "string" && typeof (item as VideoTaxonomy).topic === "string" && typeof (item as VideoTaxonomy).format === "string" && typeof (item as VideoTaxonomy).reason === "string");
}
