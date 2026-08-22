export type TrendLabel = "Exploding" | "Rising" | "Emerging" | "Stable" | "Cooling";
export type SourceMode = "demo" | "live";
export type TrendScanMeta = {
  candidatePool: number;
  exactMatches: number;
  returned: number;
  requestedLimit: number;
  sourceRequests: number;
  matchMode: "exact" | "expanded-window" | "adjacent";
  effectiveWindow?: "24h" | "3d" | "7d" | "14d";
  rankingScope: string;
  note?: string;
};

export type ShortVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  category: string;
  topic: string;
  format: string;
  taxonomySource?: "ai" | "rules";
  categoryReason?: string;
  videoKind?: "Shorts" | "Long";
  language?: "English" | "Hindi" | "Hinglish" | "Regional" | "Unknown";
  publishedAt: string;
  rawPublishedAt?: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  viewsPerHour: number;
  engagement: number;
  momentumScore: number;
  evidenceScore?: number;
  rankConfidence?: "High" | "Medium" | "Low";
  rankReason?: string;
  velocity: number;
  label: TrendLabel;
  sourceMode: SourceMode;
  sourceUrl: string;
  why: string;
  isShort?: boolean;
  shortConfidence?: number;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  color: string;
  momentum: number;
  videoCount: number;
  subtopics: { name: string; change: string; status: TrendLabel }[];
};

export type SavedItem = {
  id: string;
  type: "video" | "category" | "idea";
  title: string;
  meta: string;
  savedAt: string;
};

export type Entitlement =
  | "top_100_results"
  | "ai_categories"
  | "historical_trends"
  | "creator_intelligence"
  | "city_intelligence"
  | "competitor_radar"
  | "exports";

export type PlanId = "free" | "creator" | "pro";
