import type { ShortVideo } from "@/lib/types";

export type VideoSnapshot = { capturedAt: string; views: number; likes: number; comments: number };
export type TrendScore = { momentumScore: number; velocity: number; engagement: number; label: ShortVideo["label"] };
export type EvidenceConfidence = "High" | "Medium" | "Low";
export type SnapshotMomentumInput = {
  views: number;
  likes: number;
  comments: number;
  ageHours: number;
  durationSeconds?: number;
  isShort?: boolean;
};
export type SnapshotMomentum = TrendScore & {
  viewsPerHour: number;
  evidenceScore: number;
  rankConfidence: EvidenceConfidence;
  rankReason: string;
};

export function engagementRate(snapshot: Pick<VideoSnapshot, "views" | "likes" | "comments">): number {
  if (!snapshot.views) return 0;
  return Number((((snapshot.likes + snapshot.comments) / snapshot.views) * 100).toFixed(2));
}

export function velocity(current: VideoSnapshot, previous?: VideoSnapshot): number {
  if (!previous || previous.views <= 0) return 0;
  return Number((((current.views - previous.views) / previous.views) * 100).toFixed(1));
}

export function labelForScore(score: number): TrendScore["label"] {
  if (score >= 80) return "Exploding";
  if (score >= 68) return "Rising";
  if (score >= 55) return "Emerging";
  if (score >= 38) return "Stable";
  return "Cooling";
}

export function scoreTrend(current: VideoSnapshot, previous?: VideoSnapshot): TrendScore {
  const currentEngagement = engagementRate(current);
  const currentVelocity = velocity(current, previous);
  const momentumScore = Math.max(0, Math.min(100, Math.round(Math.min(60, currentVelocity * 0.45) + Math.min(40, currentEngagement * 4))));
  return { momentumScore, velocity: currentVelocity, engagement: currentEngagement, label: labelForScore(momentumScore) };
}

export function estimateSnapshotMomentum(input: SnapshotMomentumInput): SnapshotMomentum {
  const views = Math.max(0, Math.round(input.views));
  const likes = Math.max(0, Math.round(input.likes));
  const comments = Math.max(0, Math.round(input.comments));
  const ageHours = Math.max(input.ageHours, 0.5);
  const viewsPerHour = Math.round(views / ageHours);
  const engagement = engagementRate({ views, likes, comments });
  const reachScore = logRangeScore(views, 1_000, 5_000_000);
  const velocityScore = logRangeScore(viewsPerHour, 100, 100_000);
  const engagementScore = Math.min(100, (engagement / 12) * 100) * confidenceMultiplier(views, viewsPerHour);
  const freshnessScore = Math.max(0, 100 - Math.min(ageHours, 336) / 336 * 100);
  const formatScore = input.isShort ? 4 : input.durationSeconds && input.durationSeconds <= 600 ? 2 : 0;
  const evidenceScore = Math.round(velocityScore * 0.48 + reachScore * 0.36 + engagementScore * 0.16);
  let momentumScore = Math.round(velocityScore * 0.46 + reachScore * 0.27 + engagementScore * 0.15 + freshnessScore * 0.08 + formatScore);

  if (views < 1_000 || viewsPerHour < 50) momentumScore = Math.min(momentumScore, 32);
  else if (views < 10_000 && viewsPerHour < 500) momentumScore = Math.min(momentumScore, 45);
  else if (views < 50_000 && viewsPerHour < 1_000) momentumScore = Math.min(momentumScore, 55);

  momentumScore = Math.max(0, Math.min(100, momentumScore));
  const rankConfidence = evidenceConfidence(views, viewsPerHour);
  return {
    momentumScore,
    velocity: 0,
    engagement,
    label: labelForScore(momentumScore),
    viewsPerHour,
    evidenceScore,
    rankConfidence,
    rankReason: `${compact(viewsPerHour)} views/hour, ${compact(views)} views, ${engagement}% engagement, ${rankConfidence.toLowerCase()} evidence`,
  };
}

function logRangeScore(value: number, floor: number, ceiling: number): number {
  if (value <= floor) return 0;
  if (value >= ceiling) return 100;
  const low = Math.log10(floor);
  const high = Math.log10(ceiling);
  return (Math.log10(value) - low) / (high - low) * 100;
}

function evidenceConfidence(views: number, viewsPerHour: number): EvidenceConfidence {
  if (views >= 100_000 && viewsPerHour >= 5_000) return "High";
  if (views >= 10_000 && viewsPerHour >= 500) return "Medium";
  return "Low";
}

function confidenceMultiplier(views: number, viewsPerHour: number): number {
  const confidence = evidenceConfidence(views, viewsPerHour);
  if (confidence === "High") return 1;
  if (confidence === "Medium") return 0.82;
  return 0.48;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}
