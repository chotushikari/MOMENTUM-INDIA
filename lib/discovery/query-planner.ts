import type { DiscoveryPlan, DiscoverySort, DiscoveryWindow, RetrievalQuery, TrendScanOptions } from "@/lib/discovery/types";

export const categoryQueryDictionary: Record<string, string[]> = {
  Gaming: ["gaming", "gameplay", "mobile gaming", "minecraft", "roblox", "bgmi"],
  "AI & Tech": ["AI", "AI tools", "AI agents", "ChatGPT", "Gemini", "coding AI", "gadgets"],
  Entertainment: ["entertainment", "trailer", "comedy", "reaction", "dance", "movie"],
  Music: ["music", "song", "official music", "remix", "music video", "cover song"],
  Food: ["food", "street food", "recipe", "cooking", "restaurant", "Indian food", "food vlog"],
  Fitness: ["fitness", "workout", "gym", "bodybuilding", "weight loss", "exercise"],
  Education: ["education", "study", "tutorial", "exam", "facts", "learning"],
  Finance: ["finance", "money", "business", "stock market", "investment", "tax"],
  Travel: ["travel", "tourism", "places", "trip", "vlog"],
  "Beauty & Fashion": ["beauty", "fashion", "style", "makeup", "outfit", "skincare"],
  Sports: ["sports", "cricket", "football", "match", "ipl"],
  News: ["news", "current affairs", "breaking", "politics", "election"],
  Devotional: ["devotional", "bhajan", "spiritual", "temple", "krishna", "shiva"],
};

export function buildDiscoveryPlan(options: TrendScanOptions = {}): DiscoveryPlan {
  const normalized = {
    limit: clampLimit(options.limit),
    sort: options.sort ?? "Hot",
    format: options.format ?? "Shorts",
    window: options.window ?? "7d",
    language: options.language ?? "All",
    category: options.category ?? "All",
    signal: options.signal ?? "All signals",
    query: options.query?.trim() || undefined,
    enrich: options.enrich !== false,
  };
  const categoryTerms = normalized.category !== "All" ? categoryQueryDictionary[normalized.category] ?? [normalized.category] : [];
  const userTerms = normalized.query ? [normalized.query] : [];
  const formatTerm = normalized.format === "Shorts" ? "shorts" : normalized.format === "Long" ? "video" : "";
  const baseTerms = userTerms.length ? userTerms : categoryTerms.length ? categoryTerms.slice(0, 5) : ["trending", "viral", "latest"];
  const queries = baseTerms.map((term, index): RetrievalQuery => ({
    query: ["India", term, formatTerm].filter(Boolean).join(" "),
    order: searchOrder(normalized.sort),
    regionCode: "IN",
    relevanceLanguage: languageCode(normalized.language),
    publishedAfter: publishedAfter(normalized.window),
    purpose: index === 0 ? "primary" : "category-broad",
  }));
  if (normalized.category !== "All" && normalized.query) {
    queries.push({
      query: ["India", categoryTerms[0] ?? normalized.category, normalized.query, formatTerm].filter(Boolean).join(" "),
      order: searchOrder(normalized.sort),
      regionCode: "IN",
      relevanceLanguage: languageCode(normalized.language),
      publishedAfter: publishedAfter(normalized.window),
      purpose: "query-broad",
    });
  }
  return {
    options: normalized,
    retrieval: { platform: "youtube", regionCode: "IN", queries: uniqueQueries(queries).slice(0, 6), maxResultsPerQuery: 50 },
    enrichment: { needsVideoDetails: true, needsAiTaxonomy: normalized.enrich },
    filters: {
      format: normalized.format,
      window: normalized.window,
      language: normalized.language,
      category: normalized.category,
      signal: normalized.signal,
    },
    ranking: rankingFor(normalized.sort),
  };
}

export function publishedAfter(window: DiscoveryWindow): string {
  const hours = window === "24h" ? 24 : window === "3d" ? 72 : window === "7d" ? 168 : 336;
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function rankingFor(sort: DiscoverySort): DiscoveryPlan["ranking"] {
  if (sort === "Latest") return { method: "latest", label: "Latest first, then freshness and confidence" };
  if (sort === "Popular") return { method: "popularity", label: "Reach first, then momentum" };
  return { method: "momentum", label: "Momentum first, then velocity, reach, freshness, confidence" };
}

function searchOrder(sort: DiscoverySort): RetrievalQuery["order"] {
  if (sort === "Latest") return "date";
  if (sort === "Popular") return "viewCount";
  return "relevance";
}

function languageCode(language: TrendScanOptions["language"]): RetrievalQuery["relevanceLanguage"] {
  if (language === "English") return "en";
  if (language === "Hindi" || language === "Hinglish") return "hi";
  return undefined;
}

function clampLimit(limit: number | undefined): number {
  return Math.max(1, Math.min(limit ?? 50, 50));
}

function uniqueQueries(queries: RetrievalQuery[]): RetrievalQuery[] {
  const seen = new Set<string>();
  return queries.filter((query) => {
    const key = `${query.query}:${query.order}:${query.publishedAfter}:${query.relevanceLanguage ?? "all"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

