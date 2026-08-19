import { NextResponse } from "next/server";
import { canAccess } from "@/lib/entitlements";

export function GET() { return NextResponse.json({ plan: "free", entitlements: { top_100_results: canAccess("free", "top_100_results"), ai_categories: canAccess("free", "ai_categories"), historical_trends: canAccess("free", "historical_trends"), city_intelligence: canAccess("free", "city_intelligence"), competitor_radar: canAccess("free", "competitor_radar"), exports: canAccess("free", "exports") } }); }
