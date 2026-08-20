import { NextResponse } from "next/server";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { checkOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { checkYouTube } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const probe = new URL(request.url).searchParams.get("probe") === "true";
  const youtube = { configured: isLiveConfigured(), reachable: false, lastTested: null as string | null };
  const openai = { configured: isOpenAIConfigured(), reachable: false, lastTested: null as string | null };
  if (probe && youtube.configured) {
    try { await checkYouTube(); youtube.reachable = true; } catch { /* health stays explicit */ }
    youtube.lastTested = new Date().toISOString();
  }
  if (probe && openai.configured) {
    try { await checkOpenAI(); openai.reachable = true; } catch { /* health stays explicit */ }
    openai.lastTested = new Date().toISOString();
  }
  return NextResponse.json({ mode: getDataMode(), youtube, openai, database: { configured: false, reachable: false } });
}
