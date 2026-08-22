import type { ShortVideo, TrendScanMeta } from "@/lib/types";
import { estimateSnapshotMomentum } from "@/lib/intelligence/scoring";
import { generateVideoTaxonomyBatch, isOpenAIConfigured } from "@/lib/openai";

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
  enrich?: boolean;
};
export type TrendScanResult = { items: ShortVideo[]; meta: TrendScanMeta };

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

const relatedCategoryQueries: Record<string, string> = {
  Travel: "travel tourism places",
  "Beauty & Fashion": "beauty fashion style",
  Sports: "sports cricket football",
  News: "news current affairs",
  Devotional: "devotional spiritual bhajan",
  Other: "viral trending india",
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
  { category: "Travel", topic: "Travel discoveries", match: ["travel", "tour", "tourist", "place", "city", "trip", "vlog"] },
  { category: "Beauty & Fashion", topic: "Style and beauty", match: ["makeup", "beauty", "fashion", "outfit", "skincare", "hair", "style"] },
  { category: "Sports", topic: "Sports moments", match: ["cricket", "football", "sports", "ipl", "match", "goal", "wicket"] },
  { category: "News", topic: "Current affairs", match: ["news", "breaking", "election", "politics", "update", "report"] },
  { category: "Devotional", topic: "Devotional content", match: ["bhajan", "devotional", "spiritual", "temple", "krishna", "shiva", "ram", "hanuman"] },
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

function queryVariants(options: TrendScanOptions): string[] {
  const base = scanQuery(options);
  const category = options.category && options.category !== "All" ? categoryQueries[options.category] ?? options.category : "";
  const format = options.format === "Shorts" ? "shorts" : options.format === "Long" ? "long video" : "";
  return Array.from(new Set([
    base,
    ["India", category, format, "trending"].filter(Boolean).join(" "),
    ["India", category, options.query, "latest"].filter(Boolean).join(" "),
  ].filter(Boolean)));
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
  const inferred = inferTaxonomy(snippet.title, snippet.description, snippet.tags);
  const videoKind = classification.isShort ? "Shorts" : "Long";
  const snapshot = estimateSnapshotMomentum({ views, likes, comments, ageHours: hours, durationSeconds: duration, isShort: classification.isShort });
  return {
    id,
    title: snippet.title,
    channel: snippet.channelTitle ?? "Unknown channel",
    thumbnail,
    category: inferred.category,
    topic: inferred.topic,
    format: inferred.format,
    taxonomySource: "rules",
    videoKind,
    language: inferLanguage(snippet.title),
    publishedAt: relativePublishedAt(snippet.publishedAt),
    rawPublishedAt: snippet.publishedAt,
    durationSeconds: duration,
    views,
    likes,
    comments,
    viewsPerHour: snapshot.viewsPerHour,
    engagement: snapshot.engagement,
    momentumScore: snapshot.momentumScore,
    evidenceScore: snapshot.evidenceScore,
    rankConfidence: snapshot.rankConfidence,
    rankReason: snapshot.rankReason,
    velocity: snapshot.velocity,
    label: snapshot.label,
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

async function searchVideoIds(options: TrendScanOptions, key: string): Promise<{ ids: string[]; requests: number }> {
  const collected: string[] = [];
  let requests = 0;
  let lastError: unknown = null;
  for (const query of queryVariants(options).slice(0, 3)) {
    const search = youtubeUrl("search", key);
    search.searchParams.set("part", "snippet");
    search.searchParams.set("type", "video");
    search.searchParams.set("regionCode", "IN");
    search.searchParams.set("maxResults", "50");
    search.searchParams.set("order", searchOrder(options.sort));
    search.searchParams.set("q", query);
    const after = publishedAfter(options.window);
    if (after) search.searchParams.set("publishedAfter", after);
    const relevanceLanguage = languageCode(options.language);
    if (relevanceLanguage) search.searchParams.set("relevanceLanguage", relevanceLanguage);
    try {
      const searchData = await fetchJson<SearchResponse>(search);
      requests += 1;
      for (const id of (searchData.items ?? []).map((item) => item.id?.videoId).filter(Boolean) as string[]) {
        if (!collected.includes(id)) collected.push(id);
        if (collected.length >= 50) break;
      }
    } catch (error) {
      lastError = error;
    }
    if (collected.length >= 50) break;
  }
  if (!requests && lastError) throw lastError;
  return { ids: collected, requests };
}

async function enrichTaxonomy(items: ShortVideo[], enabled = true): Promise<ShortVideo[]> {
  if (!enabled || !isOpenAIConfigured() || !items.length) return items;
  try {
    const taxonomyItems = await generateVideoTaxonomyBatch(items);
    const byId = new Map(taxonomyItems.map((item) => [item.id, item]));
    return items.map((item) => {
      const enriched = byId.get(item.id);
      return enriched ? { ...item, category: enriched.category, topic: enriched.topic, format: enriched.format, categoryReason: enriched.reason, taxonomySource: "ai" } : item;
    });
  } catch {
    return items;
  }
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
    if (sort === "Latest") return latestRank(b) - latestRank(a) || Date.parse(b.rawPublishedAt ?? "") - Date.parse(a.rawPublishedAt ?? "");
    if (sort === "Popular") return b.views - a.views || b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour;
    return b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour || b.views - a.views;
  });
}

function latestRank(video: ShortVideo): number {
  const age = Math.max((Date.now() - Date.parse(video.rawPublishedAt ?? video.publishedAt)) / 3_600_000, 0.5);
  const recencyScore = Math.max(0, 100 - Math.min(age, 336) / 336 * 100);
  return recencyScore * 0.42 + video.momentumScore * 0.42 + (video.evidenceScore ?? 0) * 0.16;
}

export async function fetchIndiaShorts(options: number | TrendScanOptions = 50): Promise<ShortVideo[]> {
  return (await fetchIndiaTrendScan(options)).items;
}

export async function fetchIndiaTrendScan(options: number | TrendScanOptions = 50): Promise<TrendScanResult> {
  const scanOptions: TrendScanOptions = typeof options === "number" ? { limit: options, format: "Shorts" } : options;
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const requestedLimit = Math.max(1, Math.min(scanOptions.limit ?? 50, 50));
  const candidateLimit = 50;
  const useSearch = Boolean(scanOptions.category && scanOptions.category !== "All") || Boolean(scanOptions.format) || Boolean(scanOptions.window) || Boolean(scanOptions.query) || scanOptions.sort === "Latest" || Boolean(scanOptions.language && scanOptions.language !== "All");
  if (useSearch) {
    const exact = await safeRunSearchScan(scanOptions, key, requestedLimit);
    if (exact.items.length) return exact;
    if (scanOptions.window === "24h") {
      for (const expandedWindow of ["3d", "7d", "14d"] as const) {
        const expanded = await safeRunSearchScan({ ...scanOptions, window: expandedWindow }, key, requestedLimit);
        if (expanded.items.length) {
          return {
            items: expanded.items,
            meta: {
              ...expanded.meta,
              exactMatches: 0,
              matchMode: "expanded-window",
              effectiveWindow: expandedWindow,
              note: `No exact ${scanOptions.window} ${scanOptions.category && scanOptions.category !== "All" ? `${scanOptions.category} ` : ""}${scanOptions.format ?? "video"} matches were strong enough in the retrieved YouTube candidate pool, so this view expanded to ${expandedWindow}.`,
            },
          };
        }
      }
    }
    if (scanOptions.category && scanOptions.category !== "All") {
      const adjacent = await safeRunSearchScan({ ...scanOptions, category: "All", signal: "All signals", query: [categoryQueries[scanOptions.category] ?? scanOptions.category, scanOptions.query].filter(Boolean).join(" ") }, key, requestedLimit);
      if (adjacent.items.length) {
        return {
          items: adjacent.items,
          meta: {
            ...adjacent.meta,
            exactMatches: 0,
            matchMode: "adjacent",
            note: `No exact ${scanOptions.category} matches were returned from the retrieved candidate pool. Showing adjacent videos from the same search intent so you can inspect, not as exact category matches.`,
          },
        };
      }
    }
    return exact;
  }
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("chart", "mostPopular");
  videos.searchParams.set("regionCode", "IN");
  videos.searchParams.set("maxResults", String(candidateLimit));
  const videoData = await fetchJson<VideoListResponse>(videos);

  const items = (videoData.items ?? []).flatMap((item) => { const normalized = normalizeVideo(item); return normalized ? [normalized] : []; });
  const enriched = await enrichTaxonomy(items, scanOptions.enrich !== false);
  const exact = sortScanned(applyScanFilters(enriched, scanOptions), scanOptions.sort);
  return {
    items: exact.slice(0, requestedLimit),
    meta: {
      candidatePool: enriched.length,
      exactMatches: exact.length,
      returned: Math.min(exact.length, requestedLimit),
      requestedLimit,
      sourceRequests: 1,
      matchMode: "exact",
      effectiveWindow: scanOptions.window,
      rankingScope: "Ranked within the retrieved YouTube India most-popular candidate pool, not all of YouTube.",
    },
  };
}

async function runSearchScan(options: TrendScanOptions, key: string, requestedLimit: number): Promise<TrendScanResult> {
  const { ids, requests } = await searchVideoIds(options, key);
  const enriched = await enrichTaxonomy(await fetchVideoDetails(ids, key), options.enrich !== false);
  const exact = sortScanned(applyScanFilters(enriched, options), options.sort);
  return {
    items: exact.slice(0, requestedLimit),
    meta: {
      candidatePool: enriched.length,
      exactMatches: exact.length,
      returned: Math.min(exact.length, requestedLimit),
      requestedLimit,
      sourceRequests: requests + (ids.length ? 1 : 0),
      matchMode: "exact",
      effectiveWindow: options.window,
      rankingScope: "Ranked within the retrieved YouTube search candidate pool for these filters, not all of YouTube.",
      note: exact.length ? undefined : "No exact matches were returned from the retrieved YouTube candidate pool for these filters.",
    },
  };
}

async function safeRunSearchScan(options: TrendScanOptions, key: string, requestedLimit: number): Promise<TrendScanResult> {
  try {
    return await runSearchScan(options, key, requestedLimit);
  } catch {
    return {
      items: [],
      meta: {
        candidatePool: 0,
        exactMatches: 0,
        returned: 0,
        requestedLimit,
        sourceRequests: 0,
        matchMode: "exact",
        effectiveWindow: options.window,
        rankingScope: "YouTube did not return a usable candidate pool for this scan.",
        note: "The source request failed for this exact scan. Try scanning again or widen the filters.",
      },
    };
  }
}

export async function fetchIndiaShort(id: string): Promise<ShortVideo | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const videos = youtubeUrl("videos", key);
  videos.searchParams.set("part", "snippet,contentDetails,statistics");
  videos.searchParams.set("id", id);
  const response = await fetchJson<VideoListResponse>(videos);
  const video = response.items?.[0] ? normalizeVideo(response.items[0]) : null;
  return video ? (await enrichTaxonomy([video]))[0] : null;
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
  return (await fetchIndiaShorts({ ...scan, format: "All videos", category: "All", query: `${relatedCategoryQueries[video.category] ?? video.category} ${video.topic}` })).filter((item) => item.id !== video.id);
}

export async function checkYouTube(): Promise<{ reachable: boolean; itemCount: number; statisticsVerified: boolean; thumbnailsVerified: boolean }> {
  const items = await fetchIndiaShorts({ enrich: false });
  return { reachable: true, itemCount: items.length, statisticsVerified: items.some((item) => item.views >= 0 && item.likes >= 0 && item.comments >= 0), thumbnailsVerified: items.some((item) => item.thumbnail.startsWith("http")) };
}
