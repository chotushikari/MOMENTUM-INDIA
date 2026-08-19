import { NextResponse } from "next/server";
import { getDailyUsage } from "@/lib/entitlements";

export function GET() { return NextResponse.json({ plan: "free", ...getDailyUsage(), enforcement: "demo-local" }); }
