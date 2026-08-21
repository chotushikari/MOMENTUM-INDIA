import type { ShortVideo } from "@/lib/types";

export type VideoSnapshot = { capturedAt: string; views: number; likes: number; comments: number };
export type TrendScore = { momentumScore: number; velocity: number; engagement: number; label: ShortVideo["label"] };

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
