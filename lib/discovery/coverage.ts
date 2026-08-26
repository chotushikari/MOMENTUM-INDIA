import type { DiscoveryDiagnostics, DiscoveryPlan } from "@/lib/discovery/types";
import type { TrendScanMeta } from "@/lib/types";

export function coverageConfidence(diagnostics: DiscoveryDiagnostics): TrendScanMeta["coverageConfidence"] {
  if (diagnostics.enrichedCount >= 100 && diagnostics.matchedCount >= 30) return "High";
  if (diagnostics.enrichedCount >= 30 && diagnostics.matchedCount >= 8) return "Medium";
  return "Low";
}

export function buildCoverageMeta(plan: DiscoveryPlan, diagnostics: DiscoveryDiagnostics, matchMode: TrendScanMeta["matchMode"], note?: string): TrendScanMeta {
  const confidence = coverageConfidence(diagnostics);
  return {
    candidatePool: diagnostics.dedupedCount,
    exactMatches: diagnostics.matchedCount,
    returned: diagnostics.shownCount,
    requestedLimit: plan.options.limit,
    sourceRequests: diagnostics.queryCount + (diagnostics.dedupedCount ? 1 : 0),
    matchMode,
    effectiveWindow: plan.options.window,
    rankingScope: `Top signals from ${diagnostics.enrichedCount.toLocaleString()} enriched candidates analyzed for this discovery sample.`,
    note,
    retrievedCount: diagnostics.retrievedCount,
    enrichedCount: diagnostics.enrichedCount,
    matchedCount: diagnostics.matchedCount,
    shownCount: diagnostics.shownCount,
    coverageWindow: plan.options.window,
    retrievedAt: new Date().toISOString(),
    rankingMethod: plan.ranking.label,
    sources: ["YouTube search.list", "YouTube videos.list", plan.enrichment.needsAiTaxonomy ? "OpenAI taxonomy with rule fallback" : "Rule taxonomy"],
    coverageConfidence: confidence,
    signalConfidence: confidence,
    cacheHit: diagnostics.cacheHit,
    filterBreakdown: diagnostics.filterBreakdown,
  };
}

