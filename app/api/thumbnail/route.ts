import { NextResponse } from "next/server";

const allowedHosts = new Set(["i.ytimg.com", "images.unsplash.com"]);

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "Missing thumbnail URL." }, { status: 400 });
  let source: URL;
  try {
    source = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid thumbnail URL." }, { status: 400 });
  }
  if (source.protocol !== "https:" || !allowedHosts.has(source.hostname)) return NextResponse.json({ error: "Thumbnail host is not allowed." }, { status: 403 });
  const response = await fetch(source, { signal: AbortSignal.timeout(8_000), headers: { Accept: "image/avif,image/webp,image/jpeg" } }).catch(() => null);
  if (!response?.ok) return NextResponse.json({ error: "Thumbnail unavailable." }, { status: 502 });
  return new NextResponse(await response.arrayBuffer(), { headers: { "Content-Type": response.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
