import type { ShortVideo } from "@/lib/types";

type ResponsePayload = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
export type GroundedInsight = { why: string; hook: string; format: string; payoff: string };
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
  const evidence = JSON.stringify({ title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour, engagement: video.engagement, category: video.category, topic: video.topic, format: video.format });
  const payload = await requestOpenAI(`You are MOMENTUM's grounded Shorts analyst. Use only this observed evidence: ${evidence}. Do not invent metrics, causes, audience behavior, or trend history. Return strict JSON with exactly four short string fields: why, hook, format, payoff. If evidence is insufficient, say so in why.`, 220);
  const text = jsonText(outputText(payload));
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("OpenAI returned an invalid insight shape");
  const candidate = parsed as Partial<GroundedInsight>;
  if (![candidate.why, candidate.hook, candidate.format, candidate.payoff].every((value) => typeof value === "string" && value.trim())) throw new Error("OpenAI returned incomplete grounded insight");
  const why = candidate.why as string;
  const hook = candidate.hook as string;
  const format = candidate.format as string;
  const payoff = candidate.payoff as string;
  return { why, hook, format, payoff };
}

export async function generateCreatorIdeas(video: ShortVideo): Promise<CreatorIdea[]> {
  const evidence = JSON.stringify({ title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour, engagement: video.engagement, category: video.category, topic: video.topic, format: video.format });
  const payload = await requestOpenAI(`You are MOMENTUM's grounded creator strategist. Use only this observed evidence: ${evidence}. Do not invent metrics, audience behavior, or trend history. Return strict JSON with an ideas array containing exactly three objects, each with a short title and one-sentence rationale. Each idea must adapt the observed format, not copy the source video.`, 260);
  const text = jsonText(outputText(payload));
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { ideas?: unknown }).ideas)) throw new Error("OpenAI returned an invalid idea shape");
  const ideas = (parsed as { ideas: unknown[] }).ideas.filter((item): item is CreatorIdea => Boolean(item) && typeof item === "object" && typeof (item as CreatorIdea).title === "string" && typeof (item as CreatorIdea).rationale === "string");
  if (ideas.length !== 3) throw new Error("OpenAI returned incomplete creator ideas");
  return ideas;
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
