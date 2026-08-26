import type { ShortVideo, TrendScanMeta } from "@/lib/types";
import { estimateSnapshotMomentum } from "@/lib/intelligence/scoring";
import { generateVideoTaxonomyBatch, isOpenAIConfigured } from "@/lib/openai";
import { discoveryCacheKey, getDiscoveryCache, setDiscoveryCache } from "@/lib/discovery/cache";
import { buildCoverageMeta } from "@/lib/discovery/coverage";
import { createRetrievedCandidatePool } from "@/lib/discovery/candidate-retriever";
import { mergeCandidateIds } from "@/lib/discovery/candidate-merger";
import { buildDiscoveryPlan, categoryQueryDictionary } from "@/lib/discovery/query-planner";
import { summarizeEnrichment } from "@/lib/discovery/enrichment";
import type { DiscoveryDiagnostics, DiscoveryPlan, TrendScanOptions } from "@/lib/discovery/types";

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
export type { TrendScanOptions } from "@/lib/discovery/types";
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

async function retrieveCandidateIds(plan: DiscoveryPlan, key: string): Promise<{ ids: string[]; requests: number; cacheHit: boolean }> {
  const cacheKey = discoveryCacheKey({
    platform: plan.retrieval.platform,
    region: plan.retrieval.regionCode,
    sort: plan.options.sort,
    format: plan.options.format,
    window: plan.options.window,
    language: plan.options.language,
    category: plan.options.category,
    query: plan.options.query ?? "",
  });
  const cached = getDiscoveryCache<string[]>(cacheKey);
  if (cached) return { ids: cached, requests: 0, cacheHit: true };
  const groups: string[][] = [];
  let requests = 0;
  let lastError: unknown = null;
  for (const plannedQuery of plan.retrieval.queries) {
    const search = youtubeUrl("search", key);
    search.searchParams.set("part", "snippet");
    search.searchParams.set("type", "video");
    search.searchParams.set("regionCode", plannedQuery.regionCode);
    search.searchParams.set("maxResults", String(plan.retrieval.maxResultsPerQuery));
    search.searchParams.set("order", plannedQuery.order);
    search.searchParams.set("q", plannedQuery.query);
    if (plannedQuery.publishedAfter) search.searchParams.set("publishedAfter", plannedQuery.publishedAfter);
    if (plannedQuery.relevanceLanguage) search.searchParams.set("relevanceLanguage", plannedQuery.relevanceLanguage);
    try {
      const searchData = await fetchJson<SearchResponse>(search);
      requests += 1;
      groups.push((searchData.items ?? []).map((item) => item.id?.videoId).filter(Boolean) as string[]);
    } catch (error) {
      lastError = error;
    }
  }
  if (!requests && lastError) throw lastError;
  const ids = mergeCandidateIds(groups, 250);
  setDiscoveryCache(cacheKey, ids, 15 * 60_000);
  return { ids, requests, cacheHit: false };
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

function filterBreakdown(items: ShortVideo[], options: TrendScanOptions): Record<string, number> {
  const byFormat = items.filter((item) => {
    if (options.format === "Shorts") return item.videoKind === "Shorts";
    if (options.format === "Long") return item.videoKind === "Long";
    return true;
  });
  const byLanguage = byFormat.filter((item) => !options.language || options.language === "All" || item.language === options.language);
  const byCategory = byLanguage.filter((item) => !options.category || options.category === "All" || item.category === options.category);
  const bySignal = byCategory.filter((item) => !options.signal || options.signal === "All signals" || item.label === options.signal);
  return {
    candidates: items.length,
    format: byFormat.length,
    language: byLanguage.length,
    category: byCategory.length,
    signal: bySignal.length,
  };
}

function sortScanned(items: ShortVideo[], sort: TrendScanOptions["sort"]): ShortVideo[] {
  return [...items].sort((a, b) => {
    if (sort === "Latest") return Date.parse(b.rawPublishedAt ?? "") - Date.parse(a.rawPublishedAt ?? "") || freshnessRank(b) - freshnessRank(a);
    if (sort === "Popular") return b.views - a.views || b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour;
    return b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour || b.views - a.views;
  });
}

function freshnessRank(video: ShortVideo): number {
  const age = Math.max((Date.now() - Date.parse(video.rawPublishedAt ?? video.publishedAt)) / 3_600_000, 0.5);
  return Math.max(0, 100 - Math.min(age, 336) / 336 * 100);
}

export async function fetchIndiaShorts(options: number | TrendScanOptions = 50): Promise<ShortVideo[]> {
  return (await fetchIndiaTrendScan(options)).items;
}

export async function fetchIndiaTrendScan(options: number | TrendScanOptions = 50): Promise<TrendScanResult> {
  const scanOptions: TrendScanOptions = typeof options === "number" ? { limit: options, format: "Shorts" } : options;
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");
  const plan = buildDiscoveryPlan(scanOptions);
  const requestedLimit = plan.options.limit;
  const candidateLimit = 50;
  const useSearch = Boolean(scanOptions.category && scanOptions.category !== "All") || Boolean(scanOptions.format) || Boolean(scanOptions.window) || Boolean(scanOptions.query) || scanOptions.sort === "Latest" || Boolean(scanOptions.language && scanOptions.language !== "All");
  if (useSearch) {
    const exact = await safeRunSearchScan(plan, key, "exact");
    if (exact.items.length) return exact;
    if (plan.options.window === "24h") {
      for (const expandedWindow of ["3d", "7d", "14d"] as const) {
        const expandedPlan = buildDiscoveryPlan({ ...scanOptions, window: expandedWindow });
        const expanded = await safeRunSearchScan(expandedPlan, key, "expanded-window");
        if (expanded.items.length) {
          return {
            items: expanded.items,
            meta: {
              ...expanded.meta,
              exactMatches: 0,
              matchMode: "expanded-window",
              effectiveWindow: expandedWindow,
              note: `No exact ${plan.options.window} ${plan.options.category !== "All" ? `${plan.options.category} ` : ""}${plan.options.format} matches were found in the current discovery sample, so this view expanded to ${expandedWindow}.`,
            },
          };
        }
      }
    }
    if (plan.options.category !== "All") {
      const adjacentQuery = [categoryQueryDictionary[plan.options.category]?.[0] ?? plan.options.category, plan.options.query].filter(Boolean).join(" ");
      const adjacentPlan = buildDiscoveryPlan({ ...scanOptions, category: "All", signal: "All signals", query: adjacentQuery });
      const adjacent = await safeRunSearchScan(adjacentPlan, key, "adjacent");
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
  const enriched = await enrichTaxonomy(items, plan.enrichment.needsAiTaxonomy);
  const exact = sortScanned(applyScanFilters(enriched, scanOptions), scanOptions.sort);
  const diagnostics: DiscoveryDiagnostics = {
    queryCount: 1,
    retrievedCount: items.length,
    dedupedCount: items.length,
    enrichedCount: enriched.length,
    matchedCount: exact.length,
    shownCount: Math.min(exact.length, requestedLimit),
    cacheHit: false,
    filterBreakdown: filterBreakdown(enriched, scanOptions),
  };
  return {
    items: exact.slice(0, requestedLimit),
    meta: buildCoverageMeta(plan, diagnostics, "exact"),
  };
}

async function runSearchScan(plan: DiscoveryPlan, key: string, matchMode: TrendScanMeta["matchMode"]): Promise<TrendScanResult> {
  const { ids, requests, cacheHit } = await retrieveCandidateIds(plan, key);
  const pool = createRetrievedCandidatePool(plan, ids, requests, cacheHit);
  const details = await fetchVideoDetails(pool.ids, key);
  const enrichment = summarizeEnrichment(pool.ids.length, details, plan.enrichment.needsAiTaxonomy);
  const enriched = await enrichTaxonomy(details, plan.enrichment.needsAiTaxonomy);
  const exact = sortScanned(applyScanFilters(enriched, plan.options), plan.options.sort);
  const diagnostics: DiscoveryDiagnostics = {
    queryCount: pool.sourceRequests,
    retrievedCount: pool.ids.length,
    dedupedCount: pool.ids.length,
    enrichedCount: enrichment.enrichedCount,
    matchedCount: exact.length,
    shownCount: Math.min(exact.length, plan.options.limit),
    cacheHit: pool.cacheHit,
    filterBreakdown: filterBreakdown(enriched, plan.options),
  };
  logDiscovery(plan, diagnostics, matchMode);
  return {
    items: exact.slice(0, plan.options.limit),
    meta: buildCoverageMeta(plan, diagnostics, matchMode, exact.length ? undefined : "No videos matched all selected filters after retrieval, enrichment, classification, and local filtering."),
  };
}

function logDiscovery(plan: DiscoveryPlan, diagnostics: DiscoveryDiagnostics, matchMode: TrendScanMeta["matchMode"]): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[MOMENTUM discovery]", {
    region: plan.retrieval.regionCode,
    sort: plan.options.sort,
    format: plan.options.format,
    window: plan.options.window,
    language: plan.options.language,
    category: plan.options.category,
    signal: plan.options.signal,
    queryCount: plan.retrieval.queries.length,
    queries: plan.retrieval.queries.map((query) => ({ q: query.query, order: query.order, purpose: query.purpose })),
    matchMode,
    retrieved: diagnostics.retrievedCount,
    enriched: diagnostics.enrichedCount,
    matched: diagnostics.matchedCount,
    shown: diagnostics.shownCount,
    cacheHit: diagnostics.cacheHit,
    filters: diagnostics.filterBreakdown,
  });
}

async function safeRunSearchScan(plan: DiscoveryPlan, key: string, matchMode: TrendScanMeta["matchMode"]): Promise<TrendScanResult> {
  try {
    return await runSearchScan(plan, key, matchMode);
  } catch {
    const diagnostics: DiscoveryDiagnostics = {
      queryCount: 0,
      retrievedCount: 0,
      dedupedCount: 0,
      enrichedCount: 0,
      matchedCount: 0,
      shownCount: 0,
      cacheHit: false,
      filterBreakdown: { candidates: 0, format: 0, language: 0, category: 0, signal: 0 },
    };
    return {
      items: [],
      meta: buildCoverageMeta(plan, diagnostics, matchMode, "YouTube did not return a usable candidate pool for this scan. Try scanning again or widen the filters."),
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
