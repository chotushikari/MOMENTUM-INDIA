import { describe, expect, it } from "vitest";
import { engagementRate, labelForScore, scoreTrend, velocity } from "@/lib/intelligence/scoring";
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
});
