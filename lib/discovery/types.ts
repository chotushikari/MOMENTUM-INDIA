import type { ShortVideo } from "@/lib/types";

export type DiscoverySort = "Hot" | "Popular" | "Latest";
export type DiscoveryFormat = "All videos" | "Shorts" | "Long";
export type DiscoveryWindow = "24h" | "3d" | "7d" | "14d";

export type TrendScanOptions = {
  limit?: number;
  sort?: DiscoverySort;
  format?: DiscoveryFormat;
  window?: DiscoveryWindow;
  language?: "All" | NonNullable<ShortVideo["language"]>;
  category?: string;
  signal?: ShortVideo["label"] | "All signals";
  query?: string;
  enrich?: boolean;
};

export type RetrievalQuery = {
  query: string;
  order: "date" | "relevance" | "viewCount";
  regionCode: "IN";
  relevanceLanguage?: "en" | "hi";
  publishedAfter?: string;
  purpose: "primary" | "category-broad" | "query-broad";
};

export type DiscoveryPlan = {
  options: Required<Omit<TrendScanOptions, "query" | "signal">> & {
    query?: string;
    signal: ShortVideo["label"] | "All signals";
  };
  retrieval: {
    platform: "youtube";
    regionCode: "IN";
    queries: RetrievalQuery[];
    maxResultsPerQuery: number;
  };
  enrichment: {
    needsVideoDetails: true;
    needsAiTaxonomy: boolean;
  };
  filters: {
    format: DiscoveryFormat;
    window: DiscoveryWindow;
    language: TrendScanOptions["language"];
    category: string;
    signal: ShortVideo["label"] | "All signals";
  };
  ranking: {
    method: "momentum" | "latest" | "popularity";
    label: string;
  };
};

export type DiscoveryDiagnostics = {
  queryCount: number;
  retrievedCount: number;
  dedupedCount: number;
  enrichedCount: number;
  matchedCount: number;
  shownCount: number;
  cacheHit: boolean;
  filterBreakdown: Record<string, number>;
};

