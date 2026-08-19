import type { ShortVideo } from "@/lib/types";
import { labelForScore } from "@/lib/intelligence/scoring";

type SearchItem = { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; publishedAt?: string; thumbnails?: { high?: { url?: string } } } };
type VideoItem = { id?: string; snippet?: { title?: string; channelTitle?: string; publishedAt?: string; thumbnails?: { high?: { url?: string } } }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }; contentDetails?: { duration?: string } };

const endpoint = "https://www.googleapis.com/youtube/v3";

function parseDuration(value: string | undefined): number {
  const match = value?.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  return match ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0) : 0;
}

function number(value: string | undefined): number { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`YouTube request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchIndiaShorts(): Promise<ShortVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const search = new URL(`${endpoint}/search`);
  search.searchParams.set("part", "snippet"); search.searchParams.set("q", "Shorts India"); search.searchParams.set("type", "video"); search.searchParams.set("videoDuration", "short"); search.searchParams.set("order", "viewCount"); search.searchParams.set("regionCode", "IN"); search.searchParams.set("maxResults", "25"); search.searchParams.set("key", key);
  const searchData = await fetchJson<{ items?: SearchItem[] }>(search);
  const ids = (searchData.items ?? []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id)).slice(0, 20);
  if (!ids.length) return [];
  const videos = new URL(`${endpoint}/videos`);
  videos.searchParams.set("part", "snippet,statistics,contentDetails"); videos.searchParams.set("id", ids.join(",")); videos.searchParams.set("key", key);
  const videoData = await fetchJson<{ items?: VideoItem[] }>(videos);
  return (videoData.items ?? []).flatMap((item) => {
    const id = item.id; const snippet = item.snippet; const duration = parseDuration(item.contentDetails?.duration);
    if (!id || !snippet?.title || !snippet.publishedAt || !snippet.thumbnails?.high?.url || duration > 60 || duration === 0) return [];
    const views = number(item.statistics?.viewCount); const likes = number(item.statistics?.likeCount); const comments = number(item.statistics?.commentCount); const hours = Math.max((Date.now() - Date.parse(snippet.publishedAt)) / 3_600_000, .5); const viewsPerHour = Math.round(views / hours); const engagement = views ? Number(((likes + comments) / views * 100).toFixed(2)) : 0; const score = Math.max(0, Math.min(100, Math.round(Math.min(60, Math.log10(Math.max(views, 1)) * 7) + Math.min(40, engagement * 4))));
    return [{ id, title: snippet.title, channel: snippet.channelTitle ?? "Unknown channel", thumbnail: snippet.thumbnails.high.url, category: "India", topic: "Observed Shorts", format: "Short-form video", publishedAt: new Date(snippet.publishedAt).toLocaleDateString("en-IN"), durationSeconds: duration, views, likes, comments, viewsPerHour, engagement, momentumScore: score, velocity: 0, label: labelForScore(score), sourceMode: "live", sourceUrl: `https://www.youtube.com/shorts/${id}`, why: "Live source evidence is available. Interpretation is generated only after a grounded insight request." }] satisfies ShortVideo[];
  });
}

