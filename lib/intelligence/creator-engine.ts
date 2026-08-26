import type { ShortVideo } from "@/lib/types";
import type { CreatorProfile } from "@/lib/intelligence/opportunity-engine";

export type CreatorOutputMode = "Explore" | "Plan" | "Write" | "Optimize" | "Review";

export type CreatorActionPlan = {
  thesis: string;
  audience: string;
  nicheMechanics: string[];
  hook: string;
  format: string;
  payoff: string;
  remakeAngles: string[];
  titleFrames: string[];
  scriptBeats: string[];
  remixScripts: string[];
  hashtags: string[];
  descriptionDraft: string;
  thumbnailDirection: string;
  riskChecks: string[];
  validationPlan: string[];
  postingChecklist: string[];
};

export function buildCreatorActionPlan(video: ShortVideo, profile?: CreatorProfile): CreatorActionPlan {
  const kind = video.videoKind ?? (video.durationSeconds <= 180 ? "Shorts" : "Long");
  const niche = profile?.niche || (video.category === "Other" ? "your niche" : video.category.toLowerCase());
  const audience = profile?.audience || `${video.category} viewers`;
  const language = profile?.language ? ` in ${profile.language}` : "";
  const evidence = `${compact(video.viewsPerHour)} views/hour from ${compact(video.views)} views`;
  const duration = formatDuration(video.durationSeconds);
  return {
    thesis: `${video.topic} is earning attention because the promise is easy to understand, quick to judge, and supported by ${evidence}.`,
    audience: `${audience} who want a fast ${video.format.toLowerCase()} with an obvious before/after or payoff${language}.`,
    nicheMechanics: [
      `The niche rewards a clear promise in the first second, especially when the topic is ${video.topic.toLowerCase()}.`,
      `The safest remake is to preserve the viewer payoff and change the subject, setting, or constraint.`,
      `Use similar videos to confirm whether this is a one-off clip or a repeatable topic cluster.`,
    ],
    hook: hookFromTitle(video.title, video.format),
    format: `${kind} / ${duration} / ${video.format}`,
    payoff: payoffFor(video),
    remakeAngles: [
      `Translate the same promise into ${niche}: keep the tension, change the subject.`,
      `Make the first second prove the outcome: show the result, conflict, or constraint immediately.`,
      `Create a series version with three variants so the audience recognizes the pattern.`,
    ],
    titleFrames: [
      `${titleSeed(video)} in India`,
      `I tried ${lowerFirst(video.topic)} so you do not have to`,
      `Nobody tells you this about ${lowerFirst(video.category)}`,
      `${video.topic}: before you copy this trend`,
    ],
    scriptBeats: [
      "0-2s: show the strongest visual or claim first.",
      "2-7s: name the constraint, comparison, or surprise.",
      "7-18s: deliver proof through quick cuts, receipts, or visible progress.",
      "Final beat: give the viewer a clear result, opinion, or next question.",
    ],
    remixScripts: [
      `Remix 1: "I tested ${lowerFirst(video.topic)} so you can see the real result."`,
      `Remix 2: "Everyone is copying this ${lowerFirst(video.format)}. Here is the smarter version."`,
      `Remix 3: "Same idea, different niche: what happens when ${lowerFirst(niche)} creators try it?"`,
    ],
    hashtags: hashtagSet(video),
    descriptionDraft: `Source-inspired idea based on ${video.topic}. This version keeps the pattern but changes the execution for an original creator angle.`,
    thumbnailDirection: `Use one readable focal object, a human reaction when available, and 3-5 words that reinforce "${titleSeed(video)}".`,
    riskChecks: [
      "Do not copy the source video shot-for-shot; copy the pattern, not the asset.",
      "Avoid claims the observed metrics do not prove.",
      video.rankConfidence === "Low" ? "Treat this as a test signal because source evidence is still thin." : "Use similar videos to confirm the pattern before scaling.",
    ],
    validationPlan: [
      "Scan similar videos and check whether at least three clips share the same promise.",
      "Compare views/hour, not only total views.",
      "Publish one faithful adaptation and one opposite-angle test before turning it into a series.",
    ],
    postingChecklist: [
      "Open with proof, not setup.",
      "Keep captions readable on mobile.",
      "Pin a comment asking for the next version.",
      "Save the result back to MOMENTUM for comparison.",
    ],
  };
}

function hookFromTitle(title: string, format: string): string {
  if (/\?/.test(title)) return "Curiosity question that makes the viewer wait for the answer.";
  if (/\b(vs|versus)\b/i.test(title)) return "Comparison hook with an obvious winner or contrast.";
  if (/\b(secret|truth|rules|mistake|before)\b/i.test(title)) return "Insider hook that promises a hidden rule.";
  if (/\b(tried|challenge|under|only)\b/i.test(title)) return "Constraint hook with a visible finish line.";
  return `${format} hook with a clear subject and quick payoff.`;
}

function payoffFor(video: ShortVideo): string {
  if (video.engagement >= 8) return "The payoff is commentable: viewers can agree, argue, or ask for the next version.";
  if (video.viewsPerHour >= 10_000) return "The payoff is fast recognition: viewers understand the promise without extra setup.";
  if (video.durationSeconds <= 60) return "The payoff is speed: a complete idea lands before attention drops.";
  return "The payoff is utility: the viewer leaves with a clear takeaway or reference point.";
}

function titleSeed(video: ShortVideo): string {
  return video.topic || video.category || "this format";
}

function hashtagSet(video: ShortVideo): string[] {
  const base = ["#shorts", "#india", `#${slug(video.category)}`, `#${slug(video.topic)}`];
  if (video.format) base.push(`#${slug(video.format)}`);
  return Array.from(new Set(base)).slice(0, 6);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 28) || "trend";
}

function lowerFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
