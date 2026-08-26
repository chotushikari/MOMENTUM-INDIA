import { dedupeCandidateIds } from "@/lib/discovery/candidate-deduper";

export function mergeCandidateIds(groups: string[][], limit = 250): string[] {
  return dedupeCandidateIds(groups.flat()).slice(0, limit);
}

