import type { ShortVideo } from "@/lib/types";

type ResponsePayload = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
export type GroundedInsight = { why: string; hook: string; format: string; payoff: string };

export function isOpenAIConfigured(): boolean { return Boolean(process.env.OPENAI_API_KEY); }

function outputText(payload: ResponsePayload): string {
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").join("") ?? "";
}

async function requestOpenAI(input: string, maxOutputTokens: number): Promise<ResponsePayload> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", input, max_output_tokens: maxOutputTokens }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  return response.json() as Promise<ResponsePayload>;
}

export async function checkOpenAI(): Promise<{ reachable: boolean; model: string }> {
  const payload = await requestOpenAI("Reply with the single word READY.", 16);
  return { reachable: outputText(payload).trim().length > 0, model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini" };
}

export async function generateGroundedInsight(video: ShortVideo): Promise<GroundedInsight> {
  const evidence = JSON.stringify({ title: video.title, channel: video.channel, views: video.views, likes: video.likes, comments: video.comments, viewsPerHour: video.viewsPerHour, engagement: video.engagement, category: video.category, topic: video.topic, format: video.format });
  const payload = await requestOpenAI(`You are MOMENTUM's grounded Shorts analyst. Use only this observed evidence: ${evidence}. Do not invent metrics, causes, audience behavior, or trend history. Return strict JSON with exactly four short string fields: why, hook, format, payoff. If evidence is insufficient, say so in why.`, 220);
  const text = outputText(payload).replace(/^```json\s*|\s*```$/g, "");
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
