import type { DiscoveryPlan } from "@/lib/discovery/types";

export type RetrievedCandidatePool = {
  ids: string[];
  sourceRequests: number;
  cacheHit: boolean;
  plan: DiscoveryPlan;
};

export function createRetrievedCandidatePool(plan: DiscoveryPlan, ids: string[], sourceRequests: number, cacheHit: boolean): RetrievedCandidatePool {
  return { plan, ids, sourceRequests, cacheHit };
}

