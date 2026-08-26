/**
 * Script & Hook Agent
 *
 * Generates structured, production-ready script beats and hook formulas
 * grounded in observed video evidence. Never invents metrics.
 * Outputs are clearly labeled as generated direction, not guaranteed outcomes.
 */
import type { ShortVideo } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScriptLength = "15s" | "30s" | "60s";

export type HookFormula = {
  type: "Curiosity" | "Contrarian" | "Pattern Interrupt" | "Outcome" | "Question" | "Constraint" | "Shock" | "Story";
  hook: string;
  why: string;
  openingLine: string;
};

export type ScriptBeat = {
  timestamp: string;
  label: string;
  direction: string;
  spokenWords: string;
  onScreen: string;
  visualNote?: string;
};

export type ScriptOutput = {
  length: ScriptLength;
  title: string;
  beats: ScriptBeat[];
  brollSuggestions: string[];
  retentionHypothesis: string[];
  callToAction: string;
  evidenceBoundary: string;
};

export type HookOutput = {
  video: { id: string; title: string; topic: string; format: string };
  formulas: HookFormula[];
  recommended: HookFormula;
  retentionTip: string;
};

export type HashtagSet = {
  broad: string[];
  niche: string[];
  specific: string[];
  context: string[];
  stack: string[];
  rationale: string;
};

// ─── Hook Engine ─────────────────────────────────────────────────────────────

export function buildHookEngine(video: ShortVideo): HookOutput {
  const formulas: HookFormula[] = [
    buildCuriosityHook(video),
    buildContrarianHook(video),
    buildPatternInterruptHook(video),
    buildOutcomeHook(video),
    buildQuestionHook(video),
  ];

  const recommended = selectBestHook(formulas, video);

  return {
    video: { id: video.id, title: video.title, topic: video.topic, format: video.format },
    formulas,
    recommended,
    retentionTip: buildRetentionTip(video),
  };
}

function buildCuriosityHook(video: ShortVideo): HookFormula {
  return {
    type: "Curiosity",
    hook: `Open a loop that makes the viewer wait for the reveal.`,
    why: `Curiosity hooks earn retention when the topic has a non-obvious answer. ${video.topic} has enough ambiguity to sustain a question.`,
    openingLine: `"You probably don't know this about ${lowerFirst(video.topic)} — and it changes everything."`,
  };
}

function buildContrarianHook(video: ShortVideo): HookFormula {
  return {
    type: "Contrarian",
    hook: `Challenge the expected narrative about the topic.`,
    why: `Contrarian hooks spike early views when the ${video.category} audience already has a strong assumption to challenge.`,
    openingLine: `"Everyone is doing ${lowerFirst(video.topic)} wrong. Here's the version that actually works."`,
  };
}

function buildPatternInterruptHook(video: ShortVideo): HookFormula {
  return {
    type: "Pattern Interrupt",
    hook: `Start with the most unexpected visual or statement first.`,
    why: `Pattern interrupts cut through the feed fastest when the format is ${video.format} — an unexpected first frame earns the pause.`,
    openingLine: `"Wait — before you scroll — watch what happens in 8 seconds."`,
  };
}

function buildOutcomeHook(video: ShortVideo): HookFormula {
  const evidence = compact(video.viewsPerHour);
  return {
    type: "Outcome",
    hook: `Lead with the result, not the process.`,
    why: `Outcome hooks perform strongly when the topic has a clear before/after, as this ${video.format} format suggests. ${evidence} views/hr confirms the promise lands.`,
    openingLine: `"Here's what ${lowerFirst(video.topic)} actually looks like when done right."`,
  };
}

function buildQuestionHook(video: ShortVideo): HookFormula {
  return {
    type: "Question",
    hook: `Ask the question the audience is already asking internally.`,
    why: `Question hooks convert when the viewer can imagine themselves in the situation. ${video.category} viewers already wonder about ${lowerFirst(video.topic)}.`,
    openingLine: `"What if you could ${lowerFirst(video.topic)} without spending a lot? Let's test it."`,
  };
}

function selectBestHook(formulas: HookFormula[], video: ShortVideo): HookFormula {
  if (/\?/.test(video.title)) return formulas.find((f) => f.type === "Question") ?? formulas[0];
  if (/\b(vs|versus|compare)\b/i.test(video.title)) return formulas.find((f) => f.type === "Contrarian") ?? formulas[0];
  if (/\b(secret|truth|actually|nobody)\b/i.test(video.title)) return formulas.find((f) => f.type === "Curiosity") ?? formulas[0];
  if (/\b(tried|challenge|under|only|₹)\b/i.test(video.title)) return formulas.find((f) => f.type === "Outcome") ?? formulas[0];
  if (video.engagement >= 9) return formulas.find((f) => f.type === "Pattern Interrupt") ?? formulas[0];
  return formulas[0];
}

function buildRetentionTip(video: ShortVideo): string {
  if (video.durationSeconds <= 30) return "Retention hypothesis: cut ruthlessly — every second without payoff is a scroll risk. Use a visible progress indicator.";
  if (video.engagement >= 9) return "Retention hypothesis: the engagement rate signals commentability. Add a polarizing moment at the midpoint to trigger responses.";
  return "Retention hypothesis: use open loops (a question without an immediate answer) at the 8-second mark to create a pull through the middle of the Short.";
}

// ─── Script Engine ────────────────────────────────────────────────────────────

export function buildScriptEngine(video: ShortVideo, length: ScriptLength = "30s"): ScriptOutput {
  const beats = length === "15s" ? buildBeats15s(video) : length === "60s" ? buildBeats60s(video) : buildBeats30s(video);

  return {
    length,
    title: titleSuggestion(video),
    beats,
    brollSuggestions: buildBrollSuggestions(video),
    retentionHypothesis: [
      "Open with the result or the tension — not the intro.",
      `The ${video.format} format works best when each cut reveals new information rather than restating what was said.`,
      "Pin your key claim in on-screen text so viewers who skip audio still get the hook.",
    ],
    callToAction: `"Save this if you're planning to cover ${lowerFirst(video.topic)} — share your version in the comments."`,
    evidenceBoundary:
      "This script is a directional template grounded in the source video's observed topic, format, and engagement signal. It is not a script derived from the source video's actual words.",
  };
}

function buildBeats15s(video: ShortVideo): ScriptBeat[] {
  return [
    {
      timestamp: "0–2s",
      label: "HOOK",
      direction: "Show the result or tension immediately — no intro.",
      spokenWords: `"Here's what ${lowerFirst(video.topic)} looks like when it actually works."`,
      onScreen: video.topic.toUpperCase(),
      visualNote: "First frame must be the most compelling — use contrast, color, or motion.",
    },
    {
      timestamp: "2–8s",
      label: "PROOF",
      direction: "Show the evidence, constraint, or payoff moment.",
      spokenWords: `"I tested it using ${lowerFirst(video.format)} — and the result surprised me."`,
      onScreen: "SEE RESULT →",
      visualNote: "Quick cut every 1.5s to maintain pace.",
    },
    {
      timestamp: "8–13s",
      label: "PAYOFF",
      direction: "Deliver the answer or reveal.",
      spokenWords: `"The ${lowerFirst(video.topic)} part? That's where most people go wrong."`,
      onScreen: "THE REAL ANSWER",
      visualNote: "Hold on the key frame for 2 seconds minimum.",
    },
    {
      timestamp: "13–15s",
      label: "CTA",
      direction: "Simple, direct ask.",
      spokenWords: `"Follow for more ${lowerFirst(video.category)} signals."`,
      onScreen: "FOLLOW →",
    },
  ];
}

function buildBeats30s(video: ShortVideo): ScriptBeat[] {
  return [
    {
      timestamp: "0–3s",
      label: "HOOK",
      direction: "Lead with the strongest claim or visual. No setup.",
      spokenWords: `"${video.topic} — here's what nobody shows you in ${compact(video.durationSeconds)}  seconds."`,
      onScreen: video.topic.toUpperCase(),
      visualNote: "First frame: unexpected angle, face reaction, or dynamic motion.",
    },
    {
      timestamp: "3–8s",
      label: "SETUP",
      direction: "Name the constraint, comparison, or surprise.",
      spokenWords: `"Most ${lowerFirst(video.category)} creators skip the part that actually matters. I didn't."`,
      onScreen: "WHAT THEY SKIP →",
      visualNote: "Cut to a 'before' state or contrasting frame.",
    },
    {
      timestamp: "8–20s",
      label: "VALUE / ESCALATION",
      direction: "Deliver proof through quick cuts, receipts, or visible progress.",
      spokenWords: `"Here's the real breakdown of ${lowerFirst(video.topic)} — step by step."`,
      onScreen: "STEP 1 / STEP 2 / STEP 3",
      visualNote: "3–4 rapid cuts with clear on-screen text for each point. Keep each under 3s.",
    },
    {
      timestamp: "20–27s",
      label: "PAYOFF",
      direction: "Give the viewer a clear result, opinion, or next question.",
      spokenWords: `"The result? ${lowerFirst(video.format)} works — but only if you change one thing."`,
      onScreen: "THE VERDICT",
      visualNote: "Hold payoff frame for 2–3 seconds. Let the moment breathe.",
    },
    {
      timestamp: "27–30s",
      label: "CTA",
      direction: "One ask. Direct. Connected to a next step.",
      spokenWords: `"Save this. Then try it yourself and tell me what happened."`,
      onScreen: "SAVE + COMMENT",
    },
  ];
}

function buildBeats60s(video: ShortVideo): ScriptBeat[] {
  return [
    {
      timestamp: "0–3s",
      label: "HOOK",
      direction: "Strongest claim or result first — justify watching 60 seconds immediately.",
      spokenWords: `"I spent a week testing ${lowerFirst(video.topic)}. Here's everything I found."`,
      onScreen: video.topic.toUpperCase(),
      visualNote: "Dynamic opening — movement or reveal. No talking-head intro.",
    },
    {
      timestamp: "3–10s",
      label: "PROMISE",
      direction: "Tell the viewer exactly what they'll get by watching to the end.",
      spokenWords: `"By the end, you'll know the one ${lowerFirst(video.format)} rule that changes everything."`,
      onScreen: "WHAT YOU'LL LEARN",
    },
    {
      timestamp: "10–25s",
      label: "PART 1 — PROBLEM",
      direction: "Establish the gap or pain. Make the viewer feel it.",
      spokenWords: `"Most people approach ${lowerFirst(video.topic)} like this — and it costs them."`,
      onScreen: "THE PROBLEM",
      visualNote: "Show 'wrong' approach with visible consequence.",
    },
    {
      timestamp: "25–45s",
      label: "PART 2 — PROOF",
      direction: "Show the better way with concrete evidence or steps.",
      spokenWords: `"Here's the actual method — broken into three parts."`,
      onScreen: "METHOD / STEP 1 / STEP 2 / STEP 3",
      visualNote: "Use quick-cut montage with bold on-screen labels.",
    },
    {
      timestamp: "45–55s",
      label: "PAYOFF",
      direction: "Deliver the result or transformation clearly.",
      spokenWords: `"The outcome? You can apply this to ${lowerFirst(video.category)} tomorrow."`,
      onScreen: "FINAL RESULT",
      visualNote: "Hold the payoff for 3–4 seconds.",
    },
    {
      timestamp: "55–60s",
      label: "CTA",
      direction: "Ask one question to drive comments. Offer one follow-up hook.",
      spokenWords: `"Which step surprised you? Comment — and follow for part 2."`,
      onScreen: "COMMENT + FOLLOW",
    },
  ];
}

function buildBrollSuggestions(video: ShortVideo): string[] {
  return [
    `Close-up of the key object or action related to ${lowerFirst(video.topic)}.`,
    `Wide establishing shot that communicates the setting or scale of ${lowerFirst(video.category)}.`,
    `Before-and-after juxtaposition to show the transformation clearly.`,
    `Hands-on demonstration or process shot — avoids talking head without any visual proof.`,
    `Text-on-screen annotation over a static background when no visual is available for a step.`,
  ];
}

function titleSuggestion(video: ShortVideo): string {
  return `I tested ${lowerFirst(video.topic)} (here's what nobody tells you)`;
}

// ─── Hashtag Engine ───────────────────────────────────────────────────────────

export function buildHashtagEngine(video: ShortVideo): HashtagSet {
  const broad = [`#${slug(video.category)}`, "#india", "#youtube"];
  const niche = [`#${slug(video.topic)}`, `#${slug(video.format)}`];
  const specific = buildSpecificHashtags(video);
  const context = ["#indiancreators", "#youtubeshorts", "#shortsvideo"];

  const stack = Array.from(new Set([...broad, ...niche, ...specific, ...context])).slice(0, 12);

  return {
    broad,
    niche,
    specific,
    context,
    stack,
    rationale: `Broad tags (${broad.join(", ")}) reach the widest ${video.category} audience. Niche tags (${niche.join(", ")}) target the specific topic cluster. Specific tags capture intent-driven search. Context tags reinforce discovery on YouTube Shorts. Note: hashtags are a directional signal, not a reach guarantee.`,
  };
}

function buildSpecificHashtags(video: ShortVideo): string[] {
  const tags: string[] = [];
  if (video.language === "Hindi" || video.language === "Hinglish") tags.push("#hindishorts", "#hindiyoutube");
  if (video.language === "English") tags.push("#englishshorts");
  if (video.category === "Food") tags.push("#indianfood", "#foodshorts");
  if (video.category === "Travel") tags.push("#indiatravel", "#travelshorts");
  if (video.category === "Fitness") tags.push("#fitnessindia", "#workoutshorts");
  if (video.category === "AI & Tech") tags.push("#aitools", "#techshorts", "#indiatech");
  if (video.category === "Finance") tags.push("#personalfinance", "#moneytips");
  if (video.category === "Education") tags.push("#learnwitme", "#studyshorts");
  return tags.length ? tags : [`#${slug(video.category)}india`, "#creatorindia"];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

function lowerFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 28) || "trend";
}
