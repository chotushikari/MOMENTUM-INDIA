import { NextResponse } from "next/server";
import { categories } from "@/lib/demo-data";

export function GET() { return NextResponse.json({ mode: "demo", region: "India", items: categories }); }
