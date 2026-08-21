import type { ShortVideo } from "@/lib/types";
import { labelForScore } from "@/lib/intelligence/scoring";

type Thumbnail = { url?: string };
type VideoItem = {
  id?: string;
  snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string; thumbnails?: { high?: Thumbnail; medium?: Thumbnail; default?: Thumbnail }; tags?: string[] };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
};
type VideoListResponse = { items?: VideoItem[] };
type SearchItem = { id?: { videoId?: string } };
type SearchResponse = { items?: SearchItem[] };

const endpoint = "https://www.googleapis.com/youtube/v3";

export type ShortClassification = { isShort: boolean; shortConfidence: number };
export type TrendScanOptions = {
  limit?: number;
  sort?: "Hot" | "Popular" | "Latest";
  format?: "All videos" | "Shorts" | "Long";
  window?: "24h" | "3d" | "7d" | "14d";
  language?: "All" | NonNullable<ShortVideo["language"]>;
  category?: string;
  signal?: ShortVideo["label"] | "All signals";
  query?: string;
};

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

const categoryQueries: Record<string, string> = {
  Gaming: "gaming games gameplay",
  "AI & Tech": "AI technology gadgets apps",
  Entertainment: "entertainment trailer comedy music",
  Music: "music song official",
  Food: "food recipe street food",
  Fitness: "fitness workout gym",
  Education: "education learning tutorial",
  Finance: "finance money business",
};

const taxonomy = [
  { category: "Gaming", topic: "Game drops", match: ["gaming", "game", "minecraft", "roblox", "fortnite", "pubg", "cod", "call of duty", "gta", "valorant", "bgmi"] },
  { category: "AI & Tech", topic: "Tools and devices", match: ["ai", "chatgpt", "iphone", "android", "tech", "laptop", "coding", "app", "camera", "phone"] },
  { category: "Entertainment", topic: "Trailers and pop culture", match: ["trailer", "official", "movie", "film", "song", "comedy", "funny", "prank", "reaction", "dance"] },
  { category: "Music", topic: "Music releases", match: ["music", "song", "lyrics", "remix", "official video", "rap", "lofi", "cover"] },
  { category: "Food", topic: "Food challenges", match: ["food", "recipe", "street food", "restaurant", "eating", "cook", "meal", "chai", "biryani"] },
  { category: "Fitness", topic: "Fitness routines", match: ["gym", "workout", "fitness", "weight loss", "exercise", "bodybuilding", "yoga"] },
  { category: "Education", topic: "Learning and explainers", match: ["exam", "study", "learn", "tutorial", "education", "english", "facts", "history", "science"] },
  { category: "Finance", topic: "Money explainers", match: ["money", "finance", "stock", "salary", "business", "tax", "investment", "crypto"] },
];

function inferTaxonomy(title: string, description = "", tags: string[] = []) {
  const haystack = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  const match = taxonomy.find((item) => item.match.some((word) => haystack.includes(word)));
  const isQuestion = /\b(can|how|why|what|when|where|top|best)\b/i.test(title);
  const hasChallenge = /\b(challenge|try|tried|under|vs|until|before|after)\b/i.test(title);
  const format = hasChallenge ? "Challenge format" : isQuestion ? "Explainer hook" : match?.category === "Music" ? "Music release" : match?.category === "Entertainment" ? "Trailer / culture drop" : "Short-form signal";
  return {
    category: match?.category ?? "Entertainment",
    topic: match?.topic ?? "Observed Shorts",
    format,
  };
}

function inferLanguage(title: string): NonNullable<ShortVideo["language"]> {
  if (/[\u0900-\u097F]/.test(title)) return /[a-z]/i.test(title) ? "Hinglish" : "Hindi";
  if (/[^\u0000-\u007F]/.test(title)) return "Regional";
  return "English";
}

function relativePublishedAt(value: string): string {
  const hours = Math.max((Date.now() - Date.parse(value)) / 3_600_000, 0.5);
  if (hours < 24) return `${Math.max(1, Math.round(hours))}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function publishedAfter(window: TrendScanOptions["window"]): string | null {
  if (!window) return null;
  const hours = window === "24h" ? 24 : window === "3d" ? 72 : window === "7d" ? 168 : 336;
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function searchOrder(sort: TrendScanOptions["sort"]): string {
  if (sort === "Latest") return "date";
  if (sort === "Popular") return "viewCount";
  return "relevance";
}

function scanQuery(options: TrendScanOptions): string {
  const parts = ["India"];
  if (options.format === "Shorts") parts.push("shorts");
  if (options.format === "Long") parts.push("youtube video");
  if (options.category && options.category !== "All") parts.push(categoryQueries[options.category] ?? options.category);
  if (options.query) parts.push(options.query);
  return parts.join(" ");
}

function languageCode(language: TrendScanOptions["language"]): string | null {
  if (language === "English") return "en";
  if (language === "Hindi" || language === "Hinglish") return "hi";
  return null;
}

function normalizeVideo(item: VideoItem): ShortVideo | null {
  const id = item.id;
  const snippet = item.snippet;
  const duration = parseDuration(item.contentDetails?.duration);
  const classification = classifyShort(duration);
  const thumbnail = snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url;
  if (!id || !snippet?.title || !snippet.publishedAt || !thumbnail || duration <= 0) return null;
  const views = number(item.statistics?.viewCount);
  const likes = number(item.statistics?.likeCount);
  const comments = number(item.statistics?.commentCount);
  const hours = Math.max((Date.now() - Date.parse(snippet.publishedAt)) / 3_600_000, 0.5);
  const viewsPerHour = Math.round(views / hours);
  const engagement = views ? Number(((likes + comments) / views * 100).toFixed(2)) : 0;
  const score = Math.max(0, Math.min(100, Math.round(Math.min(60, Math.log10(Math.max(views, 1)) * 7) + Math.min(40, engagement * 4))));
  const inferred = inferTaxonomy(snippet.title, snippet.description, snippet.tags);
  const videoKind = classification.isShort ? "Shorts" : "Long";
  return {
    id,
    title: snippet.title,
    channel: snippet.channelTitle ?? "Unknown channel",
    thumbnail,
    category: inferred.category,
    topic: inferred.topic,
    format: inferred.format,
    videoKind,
    language: inferLanguage(snippet.title),
    publishedAt: relativePublishedAt(snippet.publishedAt),
    rawPublishedAt: snippet.publishedAt,
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
    sourceUrl: videoKind === "Shorts" ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    why: "Live source evidence is available. Interpretation is generated only after a grounded insight request.",
    isShort: classification.isShort,
    shortConfidence: classification.shortConfidence,
  };
}

async function fetchVideoDetails(ids: string[], key: string): Promise<ShortVideo[]> {
  if (!ids.length) return [];
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("id", ids.slice(0, 50).join(","));
  const videoData = await fetchJson<VideoListResponse>(videos);
  return (videoData.items ?? []).flatMap((item) => {
    const normalized = normalizeVideo(item);
    return normalized ? [normalized] : [];
  });
}

function applyScanFilters(items: ShortVideo[], options: TrendScanOptions): ShortVideo[] {
  return items.filter((item) => {
    if (options.format === "Shorts" && item.videoKind !== "Shorts") return false;
    if (options.format === "Long" && item.videoKind !== "Long") return false;
    if (options.language && options.language !== "All" && item.language !== options.language) return false;
    if (options.category && options.category !== "All" && item.category !== options.category) return false;
    if (options.signal && options.signal !== "All signals" && item.label !== options.signal) return false;
    return true;
  });
}

function sortScanned(items: ShortVideo[], sort: TrendScanOptions["sort"]): ShortVideo[] {
  return [...items].sort((a, b) => {
    if (sort === "Latest") return Date.parse(b.rawPublishedAt ?? "") - Date.parse(a.rawPublishedAt ?? "");
    if (sort === "Popular") return b.views - a.views;
    return b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour;
  });
}

export async function fetchIndiaShorts(options: number | TrendScanOptions = 50): Promise<ShortVideo[]> {
  const scanOptions: TrendScanOptions = typeof options === "number" ? { limit: options, format: "Shorts" } : options;
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const maxResults = Math.max(10, Math.min(scanOptions.limit ?? 50, 50));
  const useSearch = Boolean(scanOptions.category && scanOptions.category !== "All") || Boolean(scanOptions.format) || Boolean(scanOptions.window) || Boolean(scanOptions.query) || scanOptions.sort === "Latest" || Boolean(scanOptions.language && scanOptions.language !== "All");
  if (useSearch) {
    const search = youtubeUrl("search", key);
    search.searchParams.set("part", "snippet");
    search.searchParams.set("type", "video");
    search.searchParams.set("regionCode", "IN");
    search.searchParams.set("maxResults", String(maxResults));
    search.searchParams.set("order", searchOrder(scanOptions.sort));
    search.searchParams.set("q", scanQuery(scanOptions));
    const after = publishedAfter(scanOptions.window);
    if (after) search.searchParams.set("publishedAfter", after);
    const relevanceLanguage = languageCode(scanOptions.language);
    if (relevanceLanguage) search.searchParams.set("relevanceLanguage", relevanceLanguage);
    const searchData = await fetchJson<SearchResponse>(search);
    const ids = Array.from(new Set((searchData.items ?? []).map((item) => item.id?.videoId).filter(Boolean) as string[]));
    return sortScanned(applyScanFilters(await fetchVideoDetails(ids, key), scanOptions), scanOptions.sort).slice(0, maxResults);
  }
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("chart", "mostPopular");
  videos.searchParams.set("regionCode", "IN");
  videos.searchParams.set("maxResults", String(maxResults));
  const videoData = await fetchJson<VideoListResponse>(videos);

  const items = (videoData.items ?? []).flatMap((item) => { const normalized = normalizeVideo(item); return normalized ? [normalized] : []; });
  return sortScanned(applyScanFilters(items, scanOptions), scanOptions.sort).slice(0, maxResults);
}

export async function fetchIndiaShort(id: string): Promise<ShortVideo | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("id", id);
  const response = await fetchJson<VideoListResponse>(videos);
  return response.items?.[0] ? normalizeVideo(response.items[0]) : null;
}

export async function fetchRelatedVideos(video: ShortVideo, options: TrendScanOptions = {}): Promise<ShortVideo[]> {
  const words = video.title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length > 2).slice(0, 6).join(" ");
  const scan: TrendScanOptions = {
    limit: options.limit ?? 24,
    sort: options.sort ?? "Hot",
    format: options.format ?? video.videoKind ?? "Shorts",
    window: options.window ?? "14d",
    language: options.language ?? "All",
    category: options.category ?? video.category,
    query: `${video.topic} ${words}`.trim(),
  };
  const items = (await fetchIndiaShorts(scan)).filter((item) => item.id !== video.id);
  if (items.length) return items;
  const titleMatches = (await fetchIndiaShorts({ ...scan, format: "All videos", category: "All", query: words || video.topic })).filter((item) => item.id !== video.id);
  if (titleMatches.length) return titleMatches;
  return (await fetchIndiaShorts({ ...scan, format: "All videos", category: "All", query: `${video.category} ${video.topic}` })).filter((item) => item.id !== video.id);
}

export async function checkYouTube(): Promise<{ reachable: boolean; itemCount: number; statisticsVerified: boolean; thumbnailsVerified: boolean }> {
  const items = await fetchIndiaShorts();
  return { reachable: true, itemCount: items.length, statisticsVerified: items.some((item) => item.views >= 0 && item.likes >= 0 && item.comments >= 0), thumbnailsVerified: items.some((item) => item.thumbnail.startsWith("http")) };
}
