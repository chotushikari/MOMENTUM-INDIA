/**
 * Niche Strategy Agent
 *
 * Analyzes category/topic clusters to detect content gaps, competition level,
 * adjacent topics, and timing windows. All outputs are grounded in observed
 * evidence and clearly labeled as directional estimates.
 */
import type { ShortVideo } from "@/lib/types";

import { determineTrendLifecycle } from "@/lib/intelligence/lifecycle";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpportunityCell = "GOLD" | "STRONG" | "ANGLE" | "NICHE" | "WATCH" | "DIFFERENTIATE" | "HARD" | "AVOID";

export type OpportunityMatrixRow = {
  lifecycle: "Early" | "Rising" | "Peaking" | "Cooling";
  lowCompetition: OpportunityCell;
  highCompetition: OpportunityCell;
  advice: string;
};

export type ContentGapAnalysis = {
  dominantFormats: string[];
  missingAngles: string[];
  audienceDemandSignals: string[];
  underservedNiches: string[];
  contentGapStatement: string;
  opportunity: string;
};

export type AdjacentTopic = {
  topic: string;
  relationship: string;
  timing: "Now" | "Soon" | "Watch";
  why: string;
};

export type NicheStrategyReport = {
  niche: string;
  category: string;
  competitionLevel: "Low" | "Medium" | "High";
  timingWindow: "Optimal" | "Good" | "Late" | "Past";
  contentGap: ContentGapAnalysis;
  opportunityMatrix: OpportunityMatrixRow[];
  adjacentTopics: AdjacentTopic[];
  topAngles: string[];
  recommendedNext: string;
  evidenceBoundary: string;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildNicheStrategyReport(
  targetVideo: ShortVideo,
  poolVideos: ShortVideo[] = []
): NicheStrategyReport {
  const pool = poolVideos.filter((v) => v.id !== targetVideo.id);
  const categoryPool = pool.filter((v) => v.category === targetVideo.category);
  const lifecycle = determineTrendLifecycle(targetVideo);

  const competitionLevel = deriveCompetitionLevel(targetVideo, categoryPool);
  const timingWindow = deriveTimingWindow(lifecycle.stage, competitionLevel);
  const contentGap = buildContentGapAnalysis(targetVideo, categoryPool);
  const opportunityMatrix = buildOpportunityMatrix(lifecycle.stage);
  const adjacentTopics = buildAdjacentTopics(targetVideo);
  const topAngles = buildTopAngles(targetVideo, competitionLevel, timingWindow);

  return {
    niche: targetVideo.topic,
    category: targetVideo.category,
    competitionLevel,
    timingWindow,
    contentGap,
    opportunityMatrix,
    adjacentTopics,
    topAngles,
    recommendedNext: buildRecommendedNext(targetVideo, competitionLevel, timingWindow),
    evidenceBoundary:
      `This report is grounded in ${pool.length > 0 ? `${pool.length} related signals` : "the target video's observed metadata"}. ` +
      "It is a directional estimate from a single snapshot, not a claim of historical growth or guaranteed performance.",
  };
}

// ─── Competition Detection ────────────────────────────────────────────────────

function deriveCompetitionLevel(
  video: ShortVideo,
  categoryPool: ShortVideo[]
): "Low" | "Medium" | "High" {
  const avgViews = categoryPool.length
    ? categoryPool.reduce((s, v) => s + v.views, 0) / categoryPool.length
    : 0;
  if (video.views > 1_000_000 || avgViews > 500_000) return "High";
  if (video.views > 200_000 || avgViews > 100_000) return "Medium";
  return "Low";
}

function deriveTimingWindow(
  stage: string,
  competition: "Low" | "Medium" | "High"
): "Optimal" | "Good" | "Late" | "Past" {
  if (stage === "Early") return competition === "Low" ? "Optimal" : "Good";
  if (stage === "Rising") return competition === "High" ? "Late" : "Good";
  if (stage === "Peaking") return "Late";
  return "Past";
}

// ─── Content Gap Analysis ─────────────────────────────────────────────────────

function buildContentGapAnalysis(video: ShortVideo, pool: ShortVideo[]): ContentGapAnalysis {
  const formats = pool.map((v) => v.format).filter(Boolean);
  const formatCounts = countBy(formats);
  const dominantFormats = Object.entries(formatCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([f]) => f);

  const missingAngles = buildMissingAngles(video, dominantFormats);
  const audienceDemandSignals = buildAudienceDemandSignals(video);
  const underservedNiches = buildUnderservedNiches(video);

  const gap = missingAngles[0] ?? "Most content covers the basics; a deep-dive or process-oriented angle is underrepresented.";
  const opportunity = `Make a "${missingAngles[1] ?? "practical workflow"}" version — the audience is asking for it, but few creators are delivering it in this niche.`;

  return {
    dominantFormats: dominantFormats.length ? dominantFormats : [video.format, "Explainer", "Reaction"],
    missingAngles,
    audienceDemandSignals,
    underservedNiches,
    contentGapStatement: `Most ${video.category} Shorts are covering ${dominantFormats[0] ?? video.format} formats. ${gap}`,
    opportunity,
  };
}

function buildMissingAngles(video: ShortVideo, dominantFormats: string[]): string[] {
  const all = [
    "Step-by-step process demonstration",
    "Real-world experiment with measured outcome",
    "Expert contrast (beginner vs. advanced approach)",
    "Local India-specific perspective",
    "Contrarian take that challenges the popular assumption",
    "Series format with recurring characters or structure",
    "Behind-the-scenes or making-of angle",
    "Cost/time breakdown with receipts",
  ];
  // Filter out formats already covered
  return all.filter((a) => !dominantFormats.some((f) => a.toLowerCase().includes(f.toLowerCase()))).slice(0, 4);
}

function buildAudienceDemandSignals(video: ShortVideo): string[] {
  const signals: string[] = [
    `High engagement rate (${video.engagement?.toFixed(1) ?? "N/A"}%) suggests commentability — viewers are reacting, not just watching.`,
    `${compact(video.viewsPerHour)} views/hour signals a pull demand: viewers are actively seeking this content.`,
    `${video.format} format with this topic suggests the audience wants practical, quick answers, not long theory.`,
  ];
  if (video.comments > 500) signals.push("Comment volume above 500 suggests the topic triggers opinions — a strong signal for follow-up content.");
  return signals;
}

function buildUnderservedNiches(video: ShortVideo): string[] {
  const byCategory: Record<string, string[]> = {
    "Food": ["Tier-2 city street food", "Authentic regional recipes vs. restaurant versions", "Dietary-specific Indian recipes (vegan, diabetic)"],
    "Travel": ["Monsoon-season travel angles", "Train journey formats", "Budget solo travel for students"],
    "Fitness": ["Office-friendly routines", "Yoga vs. gym comparison for Indians", "Pre-exam stress fitness"],
    "AI & Tech": ["AI tools for Indian students", "Hindi-language tutorials for AI", "AI for small business owners in India"],
    "Finance": ["First salary breakdowns", "SIP vs. savings account explainers", "Emergency fund building for freshers"],
    "Gaming": ["Indian esports team breakdowns", "Mobile-only gameplay formats", "₹500 budget gaming setup guides"],
    "Education": ["Board exam prep formats", "Online course comparison formats", "Language-learning for job interviews"],
    "Entertainment": ["Regional language pop culture", "Behind-the-scenes of Indian creators", "Reaction to viral Indian formats"],
  };
  return byCategory[video.category] ?? ["Local regional angle", "Language-specific version (Hindi or Hinglish)", "Budget-constrained perspective for Indian audience"];
}

// ─── Opportunity Matrix ───────────────────────────────────────────────────────

function buildOpportunityMatrix(stage: string): OpportunityMatrixRow[] {
  return [
    {
      lifecycle: "Early",
      lowCompetition: "GOLD",
      highCompetition: "WATCH",
      advice: stage === "Early" ? "⬅ YOU ARE HERE — move fast, validate first" : "Early stage has passed for this topic.",
    },
    {
      lifecycle: "Rising",
      lowCompetition: "STRONG",
      highCompetition: "DIFFERENTIATE",
      advice: stage === "Rising" ? "⬅ YOU ARE HERE — a differentiated angle is still winnable" : "",
    },
    {
      lifecycle: "Peaking",
      lowCompetition: "ANGLE",
      highCompetition: "HARD",
      advice: stage === "Peaking" ? "⬅ YOU ARE HERE — only a very fresh angle has a realistic shot" : "",
    },
    {
      lifecycle: "Cooling",
      lowCompetition: "NICHE",
      highCompetition: "AVOID",
      advice: stage === "Cooling" ? "⬅ YOU ARE HERE — save the mechanic for the next cycle" : "",
    },
  ];
}

// ─── Adjacent Topics ──────────────────────────────────────────────────────────

function buildAdjacentTopics(video: ShortVideo): AdjacentTopic[] {
  const adjacencyMap: Record<string, AdjacentTopic[]> = {
    "AI agents": [
      { topic: "AI coding tools", relationship: "Same tech cluster", timing: "Now", why: "Developers exploring agents naturally move toward coding assistants." },
      { topic: "Browser automation", relationship: "Next use case", timing: "Soon", why: "Agent users want to extend to browser tasks." },
      { topic: "MCP protocol", relationship: "Emerging standard", timing: "Watch", why: "MCP is becoming the agent interoperability standard; early content will age well." },
    ],
    "Street food": [
      { topic: "Tier-2 city food", relationship: "Geographic expansion", timing: "Now", why: "Audiences in smaller cities are underserved by metro-focused food content." },
      { topic: "Night market guides", relationship: "Format extension", timing: "Soon", why: "After-hours food content has distinct audience overlap." },
      { topic: "Regional thali breakdowns", relationship: "Deeper niche", timing: "Watch", why: "Regional food diversity is a growing subcategory." },
    ],
  };

  // Find by topic keywords
  for (const [key, topics] of Object.entries(adjacencyMap)) {
    if (video.topic.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(video.topic.toLowerCase())) {
      return topics;
    }
  }

  // Fallback: generate generic adjacent topics
  return [
    { topic: `${video.topic} for beginners`, relationship: "Audience entry point", timing: "Now", why: "Beginner-level content consistently earns discovery traffic in any niche." },
    { topic: `${video.category} in Tier-2 India`, relationship: "Geographic niche", timing: "Soon", why: "Growing creator economy in non-metro cities creates underserved content demand." },
    { topic: `${video.format} format variations`, relationship: "Format extension", timing: "Watch", why: "Once a format proves itself, small variations create a series ecosystem." },
  ];
}

// ─── Top Angles & Recommendations ────────────────────────────────────────────

function buildTopAngles(
  video: ShortVideo,
  competition: "Low" | "Medium" | "High",
  timing: string
): string[] {
  const angles = [
    `Local India angle: translate "${video.topic}" for a Tier-2 or regional city audience.`,
    `Process-first version: show the real workflow of ${lowerFirst(video.topic)}, not just the outcome.`,
    `Contrarian take: challenge what most ${video.category} creators are claiming about ${lowerFirst(video.topic)}.`,
    `Series starter: make part 1 of a multi-part ${lowerFirst(video.format)} series — earns subscribers.`,
  ];
  if (competition === "High") angles.push(`Hyper-niche pivot: go deeper into a specific subcategory of ${lowerFirst(video.topic)} where fewer creators compete.`);
  if (timing === "Late" || timing === "Past") angles.push(`Evergreen variant: strip the timely hook and reframe as a timeless how-to for ${lowerFirst(video.category)}.`);
  return angles.slice(0, 4);
}

function buildRecommendedNext(
  video: ShortVideo,
  competition: "Low" | "Medium" | "High",
  timing: "Optimal" | "Good" | "Late" | "Past"
): string {
  if (timing === "Optimal" && competition === "Low") return `Move fast. Make a faithful ${lowerFirst(video.format)} version, then a second test with a local or niche angle. The window is open.`;
  if (timing === "Good") return `Create one clear differentiation from the source: a different audience, a different constraint, or a deeper process angle.`;
  if (timing === "Late") return `Only worth producing if you can add a significantly fresher angle. The obvious version is already crowded.`;
  return `Save the mechanic for the next trend cycle in ${video.category}. The current wave has peaked.`;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function countBy<T extends string>(arr: T[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {});
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

function lowerFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}
