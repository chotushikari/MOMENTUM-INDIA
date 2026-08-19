import type { Entitlement, PlanId } from "@/lib/types";

export const plans: { id: PlanId; name: string; price: string; description: string; features: string[] }[] = [
  { id: "free", name: "Free", price: "₹0", description: "See the signal before you commit.", features: ["India trends", "Top 20 results", "Basic momentum", "3 niche searches / day", "Limited AI insights"] },
  { id: "creator", name: "Creator", price: "₹499", description: "The full daily intelligence loop.", features: ["Top 100 results", "Unlimited niche search", "AI category explorer", "Trend deep dives", "Saved workspace"] },
  { id: "pro", name: "Pro", price: "₹1,499", description: "Historical intelligence for serious operators.", features: ["30-day historical trends", "Advanced analytics", "Creator intelligence", "Competitor radar", "Exports and city unlocks"] },
];

const access: Record<PlanId, Entitlement[]> = {
  free: [],
  creator: ["top_100_results", "ai_categories"],
  pro: ["top_100_results", "ai_categories", "historical_trends", "creator_intelligence", "city_intelligence", "competitor_radar", "exports"],
};

export function canAccess(plan: PlanId, entitlement: Entitlement): boolean {
  return access[plan].includes(entitlement);
}

export function getDailyUsage(): { used: number; limit: number } {
  return { used: 12, limit: 20 };
}

