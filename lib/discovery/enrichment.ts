import type { ShortVideo } from "@/lib/types";

export type EnrichmentSummary = {
  rawCandidateCount: number;
  enrichedCount: number;
  taxonomyMode: "ai-with-rule-fallback" | "rules-only";
};

export function summarizeEnrichment(rawCandidateCount: number, videos: ShortVideo[], aiEnabled: boolean): EnrichmentSummary {
  return {
    rawCandidateCount,
    enrichedCount: videos.length,
    taxonomyMode: aiEnabled ? "ai-with-rule-fallback" : "rules-only",
  };
}

