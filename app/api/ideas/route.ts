import { NextResponse } from "next/server";

export async function POST() { return NextResponse.json({ mode: "demo", ideas: [{ title: "Can Delhi feed you for ₹100?", rationale: "Carries a high-momentum constraint into a location the audience can picture." }, { title: "Tourist eats like a local for one day", rationale: "Uses contrast to create a clear opening question and final reveal." }, { title: "₹100 vs ₹1,000: same street, different story", rationale: "Turns one winning format into a repeatable comparison series." }] }); }
