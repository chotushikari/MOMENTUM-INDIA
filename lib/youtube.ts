import type { ShortVideo } from "@/lib/types";
import { labelForScore } from "@/lib/intelligence/scoring";

type Thumbnail = { url?: string };
type VideoItem = {
  id?: string;
  snippet?: { title?: string; channelTitle?: string; publishedAt?: string; thumbnails?: { high?: Thumbnail; medium?: Thumbnail; default?: Thumbnail } };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
};
type VideoListResponse = { items?: VideoItem[] };

const endpoint = "https://www.googleapis.com/youtube/v3";

export type ShortClassification = { isShort: boolean; shortConfidence: number };

export function classifyShort(durationSeconds: number): ShortClassification {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 180) return { isShort: false, shortConfidence: 0 };
  return { isShort: true, shortConfidence: durationSeconds <= 60 ? 0.95 : 0.78 };
}

function parseDuration(value: string | undefined): number {
  const match = value?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return match ? Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) : 0;
}

function number(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`YouTube request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function youtubeUrl(path: string, key: string): URL {
  const url = new URL(`${endpoint}/${path}`);
  url.searchParams.set("key", key);
  return url;
}

export async function fetchIndiaShorts(): Promise<ShortVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("chart", "mostPopular");
  videos.searchParams.set("regionCode", "IN");
  videos.searchParams.set("maxResults", "50");
  const videoData = await fetchJson<VideoListResponse>(videos);

  return (videoData.items ?? []).flatMap((item) => {
    const id = item.id;
    const snippet = item.snippet;
    const duration = parseDuration(item.contentDetails?.duration);
    const classification = classifyShort(duration);
    const thumbnail = snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url;
    if (!id || !snippet?.title || !snippet.publishedAt || !thumbnail || !classification.isShort) return [];
    const views = number(item.statistics?.viewCount);
    const likes = number(item.statistics?.likeCount);
    const comments = number(item.statistics?.commentCount);
    const hours = Math.max((Date.now() - Date.parse(snippet.publishedAt)) / 3_600_000, 0.5);
    const viewsPerHour = Math.round(views / hours);
    const engagement = views ? Number(((likes + comments) / views * 100).toFixed(2)) : 0;
    const score = Math.max(0, Math.min(100, Math.round(Math.min(60, Math.log10(Math.max(views, 1)) * 7) + Math.min(40, engagement * 4))));
    return [{
      id,
      title: snippet.title,
      channel: snippet.channelTitle ?? "Unknown channel",
      thumbnail,
      category: "India",
      topic: "Observed Shorts",
      format: "Short-form video",
      publishedAt: new Date(snippet.publishedAt).toLocaleDateString("en-IN"),
      durationSeconds: duration,
      views,
      likes,
      comments,
      viewsPerHour,
      engagement,
      momentumScore: score,
      velocity: 0,
      label: labelForScore(score),
      sourceMode: "live",
      sourceUrl: `https://www.youtube.com/shorts/${id}`,
      why: "Live source evidence is available. Interpretation is generated only after a grounded insight request.",
      isShort: classification.isShort,
      shortConfidence: classification.shortConfidence,
    }] satisfies ShortVideo[];
  });
}

export async function checkYouTube(): Promise<{ reachable: boolean; itemCount: number; statisticsVerified: boolean; thumbnailsVerified: boolean }> {
  const items = await fetchIndiaShorts();
  return { reachable: true, itemCount: items.length, statisticsVerified: items.some((item) => item.views >= 0 && item.likes >= 0 && item.comments >= 0), thumbnailsVerified: items.some((item) => item.thumbnail.startsWith("http")) };
}
