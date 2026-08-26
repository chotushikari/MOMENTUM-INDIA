import type { ShortVideo, TrendLabel } from "@/lib/types";

export type TrendLifecycleStage = "Early" | "Rising" | "Peaking" | "Saturated" | "Cooling";

export type TrendLifecycle = {
  stage: TrendLifecycleStage;
  urgency: "Act now" | "Test today" | "Validate first" | "Avoid copying blindly";
  timing: string;
  competition: string;
  action: string;
  reason: string;
};

export function determineTrendLifecycle(video: ShortVideo): TrendLifecycle {
  const ageHours = estimateAgeHours(video);
  const velocity = video.viewsPerHour;
  const confidence = video.rankConfidence ?? "Low";
  const label = video.label;

  if (label === "Cooling" || video.momentumScore < 35) {
    return {
      stage: "Cooling",
      urgency: "Avoid copying blindly",
      timing: "Use it only as a reference pattern.",
      competition: "Late or weak source signal.",
      action: "Extract the mechanic, then find fresher related videos before making a version.",
      reason: `${compact(velocity)} views/hour and ${confidence.toLowerCase()} confidence do not justify a direct copy.`,
    };
  }

  if (ageHours <= 24 && velocity >= 10_000 && video.momentumScore >= 60) {
    return {
      stage: "Rising",
      urgency: "Act now",
      timing: "Create within the next publishing window.",
      competition: "Growing, but still usable if your angle is distinct.",
      action: "Make one faithful adaptation and one opposite-angle test today.",
      reason: `${compact(velocity)} views/hour inside a fresh window indicates useful momentum.`,
    };
  }

  if (isStrongLabel(label) && video.views >= 500_000) {
    return {
      stage: "Peaking",
      urgency: "Test today",
      timing: "Move fast, but avoid a surface-level remake.",
      competition: "High: multiple creators may already be reacting.",
      action: "Remix the viewer payoff into your niche instead of copying the subject.",
      reason: `${compact(video.views)} views and a ${label.toLowerCase()} label suggest the pattern is visible to the market.`,
    };
  }

  if (ageHours <= 12 || video.views < 50_000) {
    return {
      stage: "Early",
      urgency: "Validate first",
      timing: "Save and compare against similar videos.",
      competition: "Low, but evidence can still be noisy.",
      action: "Check related videos and comments before investing in production.",
      reason: "The signal is fresh or still small, so one snapshot is directional rather than conclusive.",
    };
  }

  return {
    stage: "Saturated",
    urgency: "Validate first",
    timing: "Use only if you can add a sharper audience fit.",
    competition: "Medium to high: the obvious version may already be done.",
    action: "Change the niche, constraint, or ending before turning it into a script.",
    reason: `${compact(video.views)} views with ${compact(velocity)} views/hour looks established more than undiscovered.`,
  };
}

function isStrongLabel(label: TrendLabel): boolean {
  return label === "Exploding" || label === "Rising" || label === "Emerging";
}

function estimateAgeHours(video: ShortVideo): number {
  if (video.rawPublishedAt) {
    const published = Date.parse(video.rawPublishedAt);
    if (Number.isFinite(published)) return Math.max(1, (Date.now() - published) / 3_600_000);
  }
  const match = video.publishedAt.match(/(\d+)\s*(hour|day|week|month|year)/i);
  if (!match) return 72;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("hour")) return value;
  if (unit.startsWith("day")) return value * 24;
  if (unit.startsWith("week")) return value * 168;
  if (unit.startsWith("month")) return value * 720;
  return value * 8760;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}
