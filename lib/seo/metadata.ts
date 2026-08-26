import type { Metadata } from "next";
import type { Category, ShortVideo } from "@/lib/types";

// ─── Site constants ───────────────────────────────────────────────────────────
const SITE_NAME = "MOMENTUM";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://momentum-india.vercel.app";
const SITE_DESCRIPTION =
  "India's YouTube Shorts intelligence platform. Know what's gaining momentum before everyone else — and turn any trending signal into an original creator action plan.";
const TWITTER_HANDLE = "@momentumindia";
const OG_IMAGE = `${SITE_URL}/og-default.png`;

// ─── Root metadata ────────────────────────────────────────────────────────────
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — YouTube Shorts Intelligence for India`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "YouTube Shorts India",
    "trending shorts India",
    "India creator intelligence",
    "momentum score",
    "viral shorts tracker",
    "content creator tools India",
    "niche intelligence",
    "shorts analytics",
  ],
  authors: [{ name: "MOMENTUM" }],
  creator: "MOMENTUM",
  publisher: "MOMENTUM",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — YouTube Shorts Intelligence for India`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "MOMENTUM — YouTube Shorts Intelligence for India" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: `${SITE_NAME} — YouTube Shorts Intelligence for India`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#0f0f0f",
  },
};

// ─── Page-specific metadata generators ───────────────────────────────────────

export function buildTrendingMetadata(): Metadata {
  const title = "Trending Shorts — What's Moving in India Right Now";
  const description =
    "Live momentum scores, velocity data, and real-time trend signals for Indian YouTube Shorts. Discover what's Exploding, Rising, or Emerging before it peaks.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/trending`,
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: { title, description, images: [OG_IMAGE] },
    alternates: { canonical: `${SITE_URL}/trending` },
  };
}

export function buildVideoMetadata(video: ShortVideo): Metadata {
  const title = `${video.title} — ${video.label} on MOMENTUM`;
  const description =
    `${video.channel} · ${video.category} · ${compact(video.viewsPerHour)} views/hour · Momentum ${video.momentumScore}/100. ` +
    `${video.why.slice(0, 130)}`;
  const url = `${SITE_URL}/trending/${video.id}`;
  const image = video.thumbnail.startsWith("/")
    ? `${SITE_URL}${video.thumbnail}`
    : `/api/thumbnail?url=${encodeURIComponent(video.thumbnail)}`;
  return {
    title,
    description,
    openGraph: {
      type: "video.other",
      title,
      description,
      url,
      images: [{ url: image, width: 1280, height: 720, alt: video.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url },
  };
}

export function buildSearchMetadata(query?: string): Metadata {
  const label = query?.trim() ? `"${query.trim()}"` : "a niche";
  const title = `Search ${label} — Niche Intelligence | MOMENTUM`;
  const description = query?.trim()
    ? `Niche intelligence report for ${query.trim()} on Indian YouTube Shorts. Momentum scores, trending formats, and creator opportunity signals.`
    : "Search any niche, topic, or format on Indian YouTube Shorts. Get a grounded momentum report with creator opportunity scores.";
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/search` },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/search` },
    robots: { index: !query?.trim(), follow: true },
  };
}

export function buildCategoriesMetadata(): Metadata {
  const title = "Categories — Browse Trending Niches | MOMENTUM";
  const description =
    "Browse all trending YouTube Shorts categories in India. AI & Tech, Food, Travel, Fitness, Finance, Education, Gaming, and more — ranked by momentum.";
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/categories` },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/categories` },
  };
}

export function buildCategoryMetadata(category: Category): Metadata {
  const title = `${category.name} Shorts Trending in India — MOMENTUM`;
  const description =
    `${category.description} Momentum score: ${category.momentum}/100. ` +
    `Top subtopics: ${category.subtopics.map((s) => s.name).join(", ")}.`;
  const url = `${SITE_URL}/categories/${category.slug}`;
  return {
    title,
    description,
    openGraph: { title, description, url },
    twitter: { title, description },
    alternates: { canonical: url },
  };
}

export function buildIdeasMetadata(video?: ShortVideo): Metadata {
  const title = video
    ? `Create from "${video.title}" — Content Assistant | MOMENTUM`
    : "Content Assistant — Turn a Trend into Something Worth Making | MOMENTUM";
  const description = video
    ? `AI-grounded creator action plan for "${video.title}". Remix angles, hook formulas, script beats, and hashtag strategy — all evidence-backed.`
    : "Turn any trending Indian YouTube Short into an original creator action plan. Hook variations, script beats, content gap analysis, and posting strategy.";
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/ideas` },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/ideas` },
    robots: { index: false, follow: true },
  };
}

export function buildSavedMetadata(): Metadata {
  const title = "Saved Signals — Your Workspace | MOMENTUM";
  const description =
    "Your saved YouTube Shorts signals, creator concepts, and trend ideas. Return to any signal and pick up your content strategy where you left off.";
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/saved` },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/saved` },
    robots: { index: false, follow: false },
  };
}

// ─── JSON-LD structured data generators ──────────────────────────────────────

export function videoObjectJsonLd(video: ShortVideo): object {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.why,
    thumbnailUrl: video.thumbnail.startsWith("/")
      ? `${SITE_URL}${video.thumbnail}`
      : video.thumbnail,
    uploadDate: video.rawPublishedAt ?? new Date().toISOString(),
    duration: isoDuration(video.durationSeconds),
    contentUrl: video.sourceUrl,
    embedUrl: video.sourceUrl,
    author: {
      "@type": "Person",
      name: video.channel,
    },
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/WatchAction", userInteractionCount: video.views },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: video.likes },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: video.comments },
    ],
  };
}

export function itemListJsonLd(videos: ShortVideo[], listName: string, listUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: listUrl,
    numberOfItems: videos.length,
    itemListElement: videos.slice(0, 20).map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: video.title,
      url: `${SITE_URL}/trending/${video.id}`,
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function webAppJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `PT${m}M${s}S`;
}
