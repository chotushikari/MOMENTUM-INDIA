import type { ShortVideo } from "@/lib/types";
import { determineTrendLifecycle } from "@/lib/intelligence/lifecycle";

export type CreatorProfile = {
  niche: string;
  audience: string;
  language: string;
  format: string;
  goal: string;
};

export type ContentOpportunity = {
  score: number;
  channelFit: number;
  trendStrength: number;
  audienceFit: number;
  novelty: number;
  timing: number;
  difficulty: "Low" | "Medium" | "High";
  competition: "Low" | "Medium" | "High";
  recommendation: string;
  why: string[];
  risks: string[];
  alternatives: string[];
};

export const defaultCreatorProfile: CreatorProfile = {
  niche: "India creators",
  audience: "curious mobile viewers",
  language: "Hinglish",
  format: "Shorts",
  goal: "grow reach with original trend remixes",
};

export function buildContentOpportunity(video: ShortVideo, profile: CreatorProfile = defaultCreatorProfile): ContentOpportunity {
  const lifecycle = determineTrendLifecycle(video);
  const trendStrength = clamp(Math.round(video.momentumScore * 0.72 + confidenceBonus(video.rankConfidence)));
  const channelFit = clamp(40 + overlapScore(`${video.category} ${video.topic} ${video.format}`, `${profile.niche} ${profile.goal}`));
  const audienceFit = clamp(46 + overlapScore(`${video.category} ${video.language ?? ""} ${video.videoKind ?? ""}`, `${profile.audience} ${profile.language} ${profile.format}`));
  const novelty = clamp(78 - Math.min(35, Math.round(video.views / 250_000)) + (video.videoKind === profile.format ? 4 : 0));
  const timing = lifecycle.stage === "Rising" ? 88 : lifecycle.stage === "Early" ? 68 : lifecycle.stage === "Peaking" ? 62 : lifecycle.stage === "Cooling" ? 34 : 52;
  const score = clamp(Math.round(trendStrength * 0.38 + channelFit * 0.22 + audienceFit * 0.18 + novelty * 0.1 + timing * 0.12));
  const competition = video.views > 1_000_000 || lifecycle.stage === "Peaking" ? "High" : video.views > 200_000 ? "Medium" : "Low";
  const difficulty = video.durationSeconds > 240 || competition === "High" ? "High" : video.durationSeconds > 90 ? "Medium" : "Low";

  return {
    score,
    channelFit,
    trendStrength,
    audienceFit,
    novelty,
    timing,
    difficulty,
    competition,
    recommendation: recommendationFor(score, lifecycle.stage, video),
    why: [
      `${compact(video.viewsPerHour)} views/hour gives this a ${trendStrength}/100 trend-strength read.`,
      `${profile.niche} fit scores ${channelFit}/100 because the source sits in ${video.category} with a ${video.format.toLowerCase()} mechanic.`,
      `${lifecycle.stage} lifecycle means the best move is: ${lifecycle.action}`,
    ],
    risks: [
      video.rankConfidence === "Low" ? "Low confidence: treat the idea as a test, not a proven trend." : "Do not claim historical growth unless repeated snapshots confirm it.",
      competition === "High" ? "High reach source: direct copies will feel late unless the angle changes." : "The pattern still needs related-video validation before a series.",
      "Avoid reusing source visuals, script wording, or thumbnail composition too closely.",
    ],
    alternatives: [
      `Same hook for ${profile.niche}, but with a local creator perspective.`,
      `Opposite-angle version: challenge the source claim instead of repeating it.`,
      `Series version: make three quick variants with different subjects and compare retention.`,
    ],
  };
}

function recommendationFor(score: number, stage: string, video: ShortVideo): string {
  if (score >= 75) return `Make a fast original ${video.videoKind ?? "Shorts"} version, then test a second niche translation.`;
  if (score >= 58) return stage === "Early" ? "Validate with related videos, then make a lightweight test." : "Create only if you can add a clearer payoff than the source.";
  return "Save the mechanic, but wait for a stronger adjacent signal before producing.";
}

function confidenceBonus(confidence?: ShortVideo["rankConfidence"]): number {
  if (confidence === "High") return 22;
  if (confidence === "Medium") return 12;
  return 2;
}

function overlapScore(source: string, profile: string): number {
  const sourceTerms = terms(source);
  const profileTerms = terms(profile);
  const overlap = Array.from(sourceTerms).filter((term) => profileTerms.has(term)).length;
  return Math.min(42, overlap * 14);
}

function terms(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}
