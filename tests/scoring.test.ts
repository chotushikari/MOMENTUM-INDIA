import { describe, expect, it } from "vitest";
import { engagementRate, estimateSnapshotMomentum, labelForScore, scoreTrend, velocity } from "@/lib/intelligence/scoring";
import { buildDiscoveryPlan } from "@/lib/discovery/query-planner";
import { determineTrendLifecycle } from "@/lib/intelligence/lifecycle";
import { buildContentOpportunity, defaultCreatorProfile } from "@/lib/intelligence/opportunity-engine";
import { classifyShort } from "@/lib/youtube";

describe("momentum scoring", () => {
  it("calculates engagement from observed interactions", () => {
    expect(engagementRate({ views: 1000, likes: 80, comments: 20 })).toBe(10);
  });

  it("calculates velocity only when a previous observation exists", () => {
    expect(velocity({ capturedAt: "now", views: 120, likes: 0, comments: 0 }, { capturedAt: "then", views: 100, likes: 0, comments: 0 })).toBe(20);
    expect(velocity({ capturedAt: "now", views: 120, likes: 0, comments: 0 })).toBe(0);
  });

  it("keeps labels deterministic and bounded", () => {
    expect(labelForScore(87)).toBe("Exploding");
    expect(labelForScore(42)).toBe("Stable");
    expect(scoreTrend({ capturedAt: "now", views: 1000, likes: 100, comments: 10 }).momentumScore).toBeGreaterThanOrEqual(0);
    expect(scoreTrend({ capturedAt: "now", views: 1000, likes: 100, comments: 10 }).momentumScore).toBeLessThanOrEqual(100);
  });

  it("classifies Shorts with an explicit confidence boundary", () => {
    expect(classifyShort(45)).toEqual({ isShort: true, shortConfidence: 0.95 });
    expect(classifyShort(180)).toEqual({ isShort: true, shortConfidence: 0.78 });
    expect(classifyShort(181).isShort).toBe(false);
  });

  it("does not let tiny high-engagement samples outrank strong velocity", () => {
    const tiny = estimateSnapshotMomentum({ views: 60, likes: 8, comments: 0, ageHours: 2, isShort: true });
    const strong = estimateSnapshotMomentum({ views: 900_000, likes: 18_000, comments: 900, ageHours: 24, isShort: true });
    expect(strong.momentumScore).toBeGreaterThan(tiny.momentumScore);
    expect(tiny.rankConfidence).toBe("Low");
  });

  it("uses views per hour and reach as the primary live-scan signal", () => {
    const moving = estimateSnapshotMomentum({ views: 220_000, likes: 8_000, comments: 500, ageHours: 10, isShort: true });
    expect(moving.viewsPerHour).toBe(22_000);
    expect(["Emerging", "Rising", "Exploding"]).toContain(moving.label);
    expect(moving.rankConfidence).not.toBe("Low");
  });

  it("plans discovery as retrieval plus local intelligence filters", () => {
    const plan = buildDiscoveryPlan({ sort: "Latest", format: "Long", window: "24h", category: "Music", language: "All" });
    expect(plan.retrieval.queries.length).toBeGreaterThan(1);
    expect(plan.retrieval.queries[0].order).toBe("date");
    expect(plan.filters.category).toBe("Music");
    expect(plan.ranking.method).toBe("latest");
  });

  it("turns observed momentum into a lifecycle recommendation", () => {
    const lifecycle = determineTrendLifecycle({
      id: "x",
      title: "A strong test video",
      channel: "Creator",
      thumbnail: "/sample.jpg",
      category: "Fitness",
      topic: "Gym routine",
      format: "Challenge format",
      videoKind: "Shorts",
      publishedAt: "3 hours ago",
      durationSeconds: 38,
      views: 180_000,
      likes: 12_000,
      comments: 500,
      viewsPerHour: 60_000,
      engagement: 6.9,
      momentumScore: 78,
      rankConfidence: "High",
      velocity: 0,
      label: "Rising",
      sourceMode: "live",
      sourceUrl: "https://youtube.com/watch?v=x",
      why: "Observed source evidence",
    });
    expect(lifecycle.stage).toBe("Rising");
    expect(lifecycle.urgency).toBe("Act now");
  });

  it("scores creator opportunity from trend strength and channel fit", () => {
    const opportunity = buildContentOpportunity({
      id: "x",
      title: "AI tools for creators",
      channel: "Creator",
      thumbnail: "/sample.jpg",
      category: "AI & Tech",
      topic: "AI tools",
      format: "Explainer hook",
      videoKind: "Shorts",
      publishedAt: "1 day ago",
      durationSeconds: 52,
      views: 250_000,
      likes: 14_000,
      comments: 800,
      viewsPerHour: 10_000,
      engagement: 5.9,
      momentumScore: 70,
      rankConfidence: "Medium",
      velocity: 0,
      label: "Emerging",
      sourceMode: "live",
      sourceUrl: "https://youtube.com/watch?v=x",
      why: "Observed source evidence",
    }, { ...defaultCreatorProfile, niche: "AI tools for creators" });
    expect(opportunity.score).toBeGreaterThan(50);
    expect(opportunity.why.length).toBe(3);
  });
});
