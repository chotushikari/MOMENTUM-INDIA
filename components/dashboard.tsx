"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Activity, BarChart3, Bookmark, ChevronDown, ChevronRight, ExternalLink, Eye, Grid2X2, Heart, List, LockKeyhole, MessageCircle, Music2, Play, RefreshCw, Search, Sparkles, Tag, Video, Zap } from "lucide-react";
import { categories, sampleVideos } from "@/lib/demo-data";
import { savedServerSnapshot, savedSnapshot, subscribeToSaved, writeSavedIds } from "@/lib/saved";
import type { ShortVideo, SourceMode } from "@/lib/types";

type TrendControlsState = {
  sort: "Hot" | "Popular" | "Latest";
  format: "All videos" | "Shorts" | "Long";
  window: "24h" | "3d" | "7d" | "14d";
  language: "All" | "English" | "Hindi" | "Hinglish" | "Regional";
  category: string;
  query: string;
  view: "Grid" | "List";
  density: "Compact" | "Comfortable";
  visibleCount: number;
};

const defaultControls: TrendControlsState = { sort: "Hot", format: "Shorts", window: "7d", language: "All", category: "All", query: "", view: "Grid", density: "Compact", visibleCount: 10 };
const signalFilters = ["All signals", "Exploding", "Rising", "Emerging", "Stable", "Food", "AI & Tech"];
const categoryFilters = ["All", "Gaming", "AI & Tech", "Entertainment", "Music", "Food", "Fitness", "Education", "Finance", "Travel", "Beauty & Fashion", "Sports", "News", "Devotional"];

export function LandingPage({ videos = sampleVideos, sourceMode = "demo", dataError }: { videos?: ShortVideo[]; sourceMode?: SourceMode; dataError?: string }) {
  const topVideo = videos[0] ?? sampleVideos[0];
  const secondVideo = videos[1] ?? sampleVideos[1] ?? topVideo;
  const proof = [
    { label: "Live evidence", value: sourceMode === "live" ? `${videos.length}` : "Demo", note: sourceMode === "live" ? "YouTube signals" : "Sample fixture" },
    { label: "AI taxonomy", value: "13+", note: "creator categories" },
    { label: "Decision loop", value: "4 steps", note: "signal to idea" },
  ];
  return <main className="marketing-page">
    <nav className="marketing-nav" aria-label="MOMENTUM marketing navigation">
      <Link href="/" className="brand-lockup"><span className="brand-mark brand-letter">M</span><span>MOMENTUM</span></Link>
      <div>
        <Link href="/trending">Live trends</Link>
        <Link href="/categories">Niches</Link>
        <Link href="/pricing">Pricing</Link>
      </div>
      <Link href="/home" className="primary-button">Open app <ChevronRight size={14} /></Link>
    </nav>
    <section className="marketing-hero">
      <div className="marketing-copy">
        <p className="eyebrow"><span className="scan-dot" /> AI-powered YouTube intelligence for India</p>
        <h1>MOMENTUM turns fresh Shorts signals into creator moves.</h1>
        <p>Scan what is moving, identify the format, understand why the audience is responding, then turn the evidence into a channel-ready idea. No fake city claims, no vanity dashboards, just source-backed momentum.</p>
        <div className="hero-actions">
          <Link href="/home" className="primary-button">Start in workspace <ChevronRight size={14} /></Link>
          <Link href={liveTrendHref()} className="quiet-button">View live feed</Link>
        </div>
        <div className="marketing-proof">{proof.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}</div>
      </div>
      <div className="marketing-live-panel" aria-label="Live intelligence preview">
        <div className="live-panel-top"><span><span className="green-dot" /> {sourceMode === "live" ? "Observed YouTube evidence" : "Demo mode / Sample fixture"}</span><strong>India</strong></div>
        <Link href={`/trending/${topVideo.id}`} className="live-feature">
          <Image src={displayThumbnail(topVideo)} alt={topVideo.title} fill sizes="(max-width: 900px) 100vw, 480px" unoptimized priority />
          <span className={`trend-badge trend-${topVideo.label.toLowerCase()}`}>{topVideo.label}</span>
          <div><strong>{topVideo.title}</strong><small>{topVideo.channel} / {compact(topVideo.viewsPerHour)} views per hour</small></div>
        </Link>
        <div className="live-stack">
          <Link href={liveTrendHref({ category: topVideo.category, query: topVideo.topic })}><Sparkles size={14} /><span>Scan similar</span><strong>{topVideo.category}</strong></Link>
          <Link href={liveTrendHref({ category: secondVideo.category, query: secondVideo.topic })}><BarChart3 size={14} /><span>Open niche</span><strong>{secondVideo.topic}</strong></Link>
        </div>
      </div>
    </section>
    {dataError && <div className="provider-error landing-error" role="status"><span>Source unavailable</span><strong>{dataError}</strong><Link href="/settings">Check configuration <ChevronRight size={13} /></Link></div>}
    <section className="marketing-section">
      <SectionHeading eyebrow="How it works" title="A trend workflow, not a static report" />
      <div className="marketing-workflow">{[
        ["Scan", "Every filter combination asks the source API again."],
        ["Classify", "Shorts vs Long is detected from duration, then AI labels category, topic, and format."],
        ["Explain", "MOMENTUM separates observed metrics from AI interpretation."],
        ["Act", "Turn the verified pattern into angles, scripts, hooks, and saved ideas."],
      ].map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{text}</p></article>)}</div>
    </section>
    <section className="marketing-split">
      <div>
        <p className="eyebrow">For creators and teams</p>
        <h2>Open a category, niche, or video and the scanner follows your intent.</h2>
        <p>Category cards launch targeted scans. Detail pages pull similar videos. Search terms become query-aware feeds. The app keeps moving with the creator instead of making them restart every time.</p>
        <Link href="/home" className="primary-button">Enter workspace <ChevronRight size={14} /></Link>
      </div>
      <div className="marketing-category-board">
        {categories.slice(0, 5).map((category) => <Link href={liveTrendHref({ category: category.name })} key={category.slug}><span style={{ color: category.color }}>{category.name}</span><strong>+{category.momentum}%</strong><small>{category.subtopics[0]?.name}</small></Link>)}
      </div>
    </section>
  </main>;
}

export function HomePage({ videos = sampleVideos, sourceMode = "demo", dataError }: { videos?: ShortVideo[]; sourceMode?: SourceMode; dataError?: string }) {
  const saved = JSON.parse(useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot)) as string[];
  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    writeSavedIds(next);
  }
  const modeLabel = sourceMode === "live" ? "Observed YouTube evidence" : "Demo mode / Sample fixture";
  const topVideo = videos[0] ?? sampleVideos[0];
  const risingCount = videos.filter((video) => ["Exploding", "Rising"].includes(video.label)).length;
  const topCategories = Array.from(new Set(videos.map((video) => video.category))).slice(0, 4);
  return <>
    <section className="home-landing-hero">
      <div className="home-hero-copy"><p className="eyebrow">MOMENTUM / INDIA / YOUTUBE SHORTS INTELLIGENCE</p><h1>Pick a signal, open the live feed, make the next move.</h1><p>MOMENTUM reads public YouTube evidence, ranks unusual attention, detects Shorts versus Long, asks AI to classify the video, and turns it into creator-ready action without inventing fake local or historical data.</p><div className="hero-actions"><Link href={liveTrendHref()} className="primary-button">Open live feed <ChevronRight size={14} /></Link><Link href="/categories" className="quiet-button">Explore niches</Link></div></div>
      <div className="hero-intel-board" aria-label="MOMENTUM preview">
        <div className="hero-board-top"><span><span className="green-dot" /> {modeLabel}</span><strong>{videos.length} signals</strong></div>
        <Link href={`/trending/${topVideo.id}`} className="hero-signal-card"><Image src={displayThumbnail(topVideo)} alt={topVideo.title} fill sizes="360px" unoptimized priority /><span className={`trend-badge trend-${topVideo.label.toLowerCase()}`}>{topVideo.label}</span><div><strong>{topVideo.title}</strong><small>{topVideo.channel} / {compact(topVideo.viewsPerHour)} views per hour</small></div></Link>
        <div className="hero-workflow"><span>Evidence</span><ChevronRight size={13} /><span>Momentum</span><ChevronRight size={13} /><span>Reason</span><ChevronRight size={13} /><span>Idea</span></div>
      </div>
    </section>
    <div className="signal-strip" aria-label="India Shorts signal summary"><div className="metric-cell"><p>Shorts tracked</p><strong>{videos.length}</strong><small>{modeLabel}</small></div><div className="metric-cell metric-accent"><p>Momentum rising</p><strong>{risingCount}</strong><small>Exploding or rising</small></div><div className="metric-cell"><p>Emerging niches</p><strong>{categories.length}</strong><small>Creator markets</small></div><div className="metric-cell"><p>Freshness</p><strong>{sourceMode === "live" ? "Now" : "Sample"}</strong><small>No fake real-time claims</small></div></div>
    {dataError && <div className="provider-error" role="status"><span>Source unavailable</span><strong>{dataError}</strong><Link href="/settings">Check configuration <ChevronRight size={13} /></Link></div>}
    <section className="home-lead-grid"><article className="lead-signal panel-surface"><div className="lead-copy"><p className="eyebrow">What MOMENTUM does</p><h2>India-wide Shorts evidence, compressed into decisions.</h2><p>Start with the feed, open a video, read the reason, then generate an angle that keeps the original evidence attached. Premium layers add city, competitor, creator-fit, export, and longer-history intelligence when there is enough repeated signal.</p><div className="lead-meta">{["No fake city data", "Grounded AI ideas", "Source attribution", "Creator workflow"].map((item) => <span key={item}>{item}</span>)}</div></div><Link href={`/trending/${topVideo.id}`} className="lead-thumb"><Image src={displayThumbnail(topVideo)} alt={topVideo.title} fill sizes="260px" unoptimized priority /><span className={`trend-badge trend-${topVideo.label.toLowerCase()}`}>{topVideo.label}</span></Link></article><aside className="market-brief panel-surface"><SectionHeading eyebrow="Market brief" title="What to inspect first" /><div className="brief-list">{videos.slice(0, 4).map((video, index) => <Link href={`/trending/${video.id}`} className="brief-row" key={video.id}><span className="rank-token">#{index + 1}</span><div><strong>{video.topic}</strong><small>{video.category} / {video.format}</small></div><em>{video.velocity ? `+${video.velocity}%` : compact(video.viewsPerHour)}</em></Link>)}</div></aside></section>
    <section className="content-section"><SectionHeading eyebrow="Workflow" title="From trend to publishable angle" /><div className="home-workflow-grid">{["Find the Shorts getting unusual attention in India.", "Understand the hook, payoff, audience, and format behind the signal.", "Turn a verified pattern into titles, hooks, scripts, and channel-fit ideas."].map((text, index) => <article key={text}><span>{String(index + 1).padStart(2, "0")}</span><p>{text}</p></article>)}</div></section>
    <section className="content-section"><SectionHeading eyebrow="Rising now" title="Top Shorts right now" link={liveTrendHref()} linkLabel="Open feed" /><div className="video-grid video-grid-wide reference-video-grid">{videos.slice(0, 4).map((video, index) => <ShortCard key={video.id} rank={index + 1} video={video} saved={saved.includes(video.id)} onSave={() => toggleSave(video.id)} />)}</div></section>
    <section className="content-section"><SectionHeading eyebrow="Creator markets" title={topCategories.length ? "Live topic clusters" : "Content niches"} link="/categories" linkLabel="Explore niches" /><div className="category-grid">{categories.filter((category) => !topCategories.length || topCategories.includes(category.name)).slice(0, 4).map((category) => <CategoryPreview key={category.slug} {...category} />)}{!categories.some((category) => topCategories.includes(category.name)) && categories.slice(0, 4).map((category) => <CategoryPreview key={category.slug} {...category} />)}</div></section>
    <section className="locked-banner"><div><p className="eyebrow">Premium intelligence</p><h2>City, creator, historical, and competitor signals are visible but locked.</h2><p>MOMENTUM tracks India-wide Shorts today. Local and historical layers stay locked until there is evidence behind them.</p></div><Link href="/pricing" className="quiet-button"><LockKeyhole size={14} /> View plans</Link></section>
  </>;
}

function SourceTabs() {
  return <div className="source-tabs" role="tablist" aria-label="Trend source"><button className="source-tab-active" role="tab" aria-selected="true"><Video size={13} /> YouTube</button><button role="tab" aria-selected="false" disabled><Music2 size={13} /> TikTok <small>soon</small></button><button role="tab" aria-selected="false" disabled><Music2 size={13} /> Instagram <small>soon</small></button></div>;
}

function TrendControls({ state, onChange }: { state: TrendControlsState; onChange: (next: Partial<TrendControlsState>) => void }) {
  const button = (key: keyof TrendControlsState, value: string, label = value, disabled = false) => <button disabled={disabled} onClick={() => onChange({ [key]: value } as Partial<TrendControlsState>)} className={state[key] === value ? "control-active" : ""}>{label}</button>;
  const activeFilters = [state.query && `Query: ${state.query}`, state.language !== "All" && state.language, state.format !== "All videos" && state.format, state.category !== "All" && state.category, "India"].filter(Boolean) as string[];
  return <section className="trend-controls" aria-label="Trend filters">
    <div className="trend-control-top"><div className="trend-pills">{button("sort", "Hot", "Hot")} {button("sort", "Popular", "Popular")} {button("sort", "Latest", "Latest")}</div><div className="control-actions"><button className={`icon-button ${state.view === "Grid" ? "control-active" : ""}`} onClick={() => onChange({ view: "Grid" })} aria-label="Grid view" title="Grid view"><Grid2X2 size={13} /></button><button className={`icon-button ${state.view === "List" ? "control-active" : ""}`} onClick={() => onChange({ view: "List" })} aria-label="List view" title="List view"><List size={13} /></button>{button("density", "Compact")} {button("density", "Comfortable")}<button className="control-select" onClick={() => onChange({ visibleCount: state.visibleCount === 10 ? 20 : 10 })}>{state.visibleCount} <ChevronDown size={13} /></button></div></div>
    <div className="trend-filter-row"><span className="filter-label">FORMAT</span>{button("format", "All videos")} {button("format", "Shorts")} {button("format", "Long")}<span className="filter-label filter-spacer">TIME WINDOW</span>{button("window", "24h")} {button("window", "3d")} {button("window", "7d")} {button("window", "14d")}<button className="locked-filter" disabled>30d <LockKeyhole size={10} /></button><span className="filter-label filter-spacer">LANGUAGE</span>{button("language", "All")} {button("language", "English")} {button("language", "Hindi")} {button("language", "Hinglish")} {button("language", "Regional")}<span className="filter-label filter-spacer">REGION</span><button className="control-active">India</button></div>
    <div className="category-filter-row"><span className="filter-label">CATEGORY</span>{categoryFilters.map((item) => button("category", item))}</div>
    <div className="active-filter-row"><span>Active filters</span>{activeFilters.map((item) => <span className="active-filter" key={item}>{item} <button aria-label={`Remove ${item} filter`} onClick={() => item.startsWith("Query:") ? onChange({ query: "" }) : item === state.language ? onChange({ language: "All" }) : item === state.format ? onChange({ format: "All videos" }) : item === state.category ? onChange({ category: "All" }) : undefined}>x</button></span>)}</div>
  </section>;
}

export function TrendingPage({ videos = sampleVideos, sourceMode = "demo", dataError }: { videos?: ShortVideo[]; sourceMode?: SourceMode; dataError?: string }) {
  const searchParams = useSearchParams();
  const signature = searchParams.toString();
  return <TrendingScanner key={signature} videos={videos} sourceMode={sourceMode} dataError={dataError} initialControls={controlsFromParams(searchParams)} initialFilter={filterFromParams(searchParams)} />;
}

function TrendingScanner({ videos, sourceMode, dataError, initialControls, initialFilter }: { videos: ShortVideo[]; sourceMode: SourceMode; dataError?: string; initialControls: TrendControlsState; initialFilter: string }) {
  const [items, setItems] = useState(videos);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNonce, setScanNonce] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [controls, setControls] = useState<TrendControlsState>(initialControls);
  const [filter, setFilter] = useState(initialFilter);
  const requestQuery = trendQuery(controls, filter, Math.max(20, controls.visibleCount));
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setScanning(true);
      setLoadError("");
      fetch(`/api/trends?${requestQuery}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() as Promise<{ items?: ShortVideo[] }> : Promise.reject())
        .then((payload) => setItems(payload.items ?? []))
        .catch((error: Error) => {
          if (error.name !== "AbortError") setLoadError("Could not scan YouTube for these filters right now.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setScanning(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestQuery, scanNonce]);
  const filtered = sortVideos(items.filter((video) => matchesControls(video, controls) && (filter === "All signals" || video.label === filter || video.category === filter)), controls.sort);
  const shown = filtered.slice(0, controls.visibleCount);
  async function loadMore() {
    setLoadingMore(true);
    setLoadError("");
    try {
      const nextLimit = Math.min(50, Math.max(items.length + 10, controls.visibleCount + 10));
      const response = await fetch(`/api/trends?${trendQuery(controls, filter, nextLimit)}`);
      const payload = await response.json() as { items?: ShortVideo[] };
      if (!response.ok || !payload.items) throw new Error();
      const merged = [...items, ...payload.items.filter((video) => !items.some((existing) => existing.id === video.id))];
      setItems(merged);
      setControls((current) => ({ ...current, visibleCount: Math.min(50, current.visibleCount + 10) }));
    } catch {
      setLoadError("Could not retrieve more videos right now.");
    } finally {
      setLoadingMore(false);
    }
  }
  return <><section className="trend-workspace-heading"><div><p className="eyebrow">DISCOVER / INDIA / {sourceMode === "live" ? "OBSERVED" : "DEMO MODE"}</p><h1>What&apos;s Trending</h1><p>Every selected filter calls the scanner again, then classifies each result as Shorts or Long from source duration.</p></div><div className="trend-heading-actions"><button className="primary-button scan-button" onClick={() => setScanNonce((value) => value + 1)} disabled={scanning}><RefreshCw size={14} className={scanning ? "spin" : ""} /> {scanning ? "Scanning" : "Scan again"}</button><Link href="/search" className="quiet-button"><Search size={14} /> Search niche</Link></div></section><SourceTabs /><TrendControls state={controls} onChange={(next) => setControls((current) => ({ ...current, ...next, visibleCount: next.visibleCount ?? 10 }))} /><div className="filter-bar secondary-filters">{signalFilters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "filter-active" : ""}>{item}</button>)}</div>{dataError && <div className="provider-error" role="status"><span>Source unavailable</span><strong>{dataError}</strong><Link href="/settings">Check configuration <ChevronRight size={13} /></Link></div>}<div className="workspace-results"><div><span className={scanning ? "scan-dot is-scanning" : "green-dot"} /> {scanning ? "Scanning YouTube..." : `${filtered.length} matching signals`} <span>/</span> {items.length} retrieved <span>/</span> {sourceMode === "live" ? `API filters: ${activeScanSummary(controls, filter)}` : "Sample fixture"}</div><div className="sample-label">YOUTUBE {controls.format === "All videos" ? "VIDEOS" : controls.format.toUpperCase()}</div></div>{shown.length ? controls.view === "Grid" ? <div className={`video-grid video-grid-wide reference-video-grid ${controls.density === "Comfortable" ? "video-grid-comfortable" : ""}`}>{shown.map((video, index) => <ShortCard key={video.id} rank={index + 1} video={video} />)}</div> : <div className="video-list-view">{shown.map((video, index) => <ShortListRow key={video.id} rank={index + 1} video={video} />)}</div> : <div className="search-empty trend-empty"><div className="search-empty-icon"><Search size={22} /></div><h2>{scanning ? "Scanning for matching videos." : "No exact signal for those controls."}</h2><p>{scanning ? "MOMENTUM is asking YouTube for the selected format, time window, language, category, and query." : "Try another category, language, or time window. MOMENTUM will not fill gaps with fake trend data."}</p></div>}<div className="load-more-panel">{loadError && <span>{loadError}</span>}<button className="quiet-button" onClick={loadMore} disabled={loadingMore || scanning || controls.visibleCount >= 50}>{loadingMore ? "Retrieving..." : shown.length < filtered.length ? "Show more matches" : "Retrieve more videos"} <ChevronRight size={14} /></button></div></>;
}

function trendQuery(controls: TrendControlsState, filter: string, limit: number): string {
  const params = new URLSearchParams({
    limit: String(limit),
    sort: controls.sort,
    format: controls.format,
    window: controls.window,
    language: controls.language,
    category: categoryForRequest(controls, filter),
    signal: signalForRequest(filter),
  });
  if (controls.query.trim()) params.set("q", controls.query.trim());
  return params.toString();
}

function categoryForRequest(controls: TrendControlsState, filter: string): string {
  if (["Food", "AI & Tech"].includes(filter)) return filter;
  return controls.category;
}

function signalForRequest(filter: string): string {
  return ["Exploding", "Rising", "Emerging", "Stable", "Cooling"].includes(filter) ? filter : "All signals";
}

function activeScanSummary(controls: TrendControlsState, filter: string): string {
  return [controls.query && `"${controls.query}"`, controls.format, controls.window, controls.language !== "All" && controls.language, categoryForRequest(controls, filter) !== "All" && categoryForRequest(controls, filter), signalForRequest(filter) !== "All signals" && signalForRequest(filter), "AI taxonomy"].filter(Boolean).join(" / ");
}

function matchesControls(video: ShortVideo, controls: TrendControlsState): boolean {
  if (controls.format === "Shorts" && !isShortVideo(video)) return false;
  if (controls.format === "Long" && (video.videoKind ?? "Shorts") !== "Long") return false;
  if (controls.language !== "All" && (video.language ?? inferLanguageFromTitle(video.title)) !== controls.language) return false;
  if (controls.category !== "All" && video.category !== controls.category) return false;
  return ageHours(video.publishedAt) <= windowHours(controls.window);
}

function sortVideos(videos: ShortVideo[], sort: TrendControlsState["sort"]): ShortVideo[] {
  return [...videos].sort((a, b) => {
    if (sort === "Popular") return b.views - a.views;
    if (sort === "Latest") return ageHours(a.publishedAt) - ageHours(b.publishedAt);
    return b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour;
  });
}

function isShortVideo(video: ShortVideo): boolean {
  return video.videoKind ? video.videoKind === "Shorts" : video.durationSeconds <= 180;
}

function windowHours(value: TrendControlsState["window"]): number {
  return value === "24h" ? 24 : value === "3d" ? 72 : value === "7d" ? 168 : 336;
}

function ageHours(value: string): number {
  const relative = value.match(/^(\d+)(h|d)\s+ago$/i);
  if (relative) return Number(relative[1]) * (relative[2].toLowerCase() === "d" ? 24 : 1);
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.max((Date.now() - parsed) / 3_600_000, 0.5) : 0.5;
}

function inferLanguageFromTitle(title: string): NonNullable<ShortVideo["language"]> {
  if (/[\u0900-\u097F]/.test(title)) return /[a-z]/i.test(title) ? "Hinglish" : "Hindi";
  if (/[^\u0000-\u007F]/.test(title)) return "Regional";
  return "English";
}

export function CategoriesPage() { return <><PageIntro eyebrow="INTELLIGENCE / CREATOR MARKETS" title="Content Niches" description="A compact map of the categories, formats, and topics carrying attention across Indian Shorts." action={<Link href="/search" className="quiet-button"><Search size={14} /> Search niche</Link>} /><div className="category-grid category-grid-large">{categories.map((category) => <CategoryPreview key={category.slug} {...category} expanded />)}</div><div className="locked-banner compact"><div><p className="eyebrow">Historical intelligence</p><h2>Track how a niche developed over 30 days.</h2><p>Longer history is a premium layer. It is locked until there are repeated observations behind it.</p></div><Link href="/pricing" className="primary-button">Unlock intelligence <ChevronRight size={15} /></Link></div></>; }

export function CategoryPage({ category }: { category: (typeof categories)[number] }) { const related = sampleVideos.filter((video) => video.category === category.name); return <><Link href="/categories" className="back-link">← All niches</Link><PageIntro eyebrow={`Niche intelligence / ${category.videoCount.toLocaleString()} signals`} title={category.name} description={category.description} action={<Link href={liveTrendHref({ category: category.name })} className="primary-button"><Zap size={14} /> Scan this niche</Link>} /><section className="category-hero panel-surface"><div className="category-score" style={{ "--score-color": category.color } as React.CSSProperties}><span>{category.momentum}</span><small>momentum</small></div><div><p className="eyebrow">What is moving inside this niche</p><h2>Click a topic to retrieve fresh videos for that angle.</h2><p>Current scans use YouTube evidence and AI taxonomy. Historical growth remains locked until repeated observations exist.</p></div></section><section className="content-section"><SectionHeading eyebrow="Emerging topics" title="Subtopics to watch" /><div className="topic-list">{category.subtopics.map((topic) => <Link href={liveTrendHref({ category: category.name, query: topic.name, signal: topic.status })} key={topic.name} className="topic-row"><span className="topic-dot" style={{ backgroundColor: category.color }} /><strong>{topic.name}</strong><span className="topic-status">{topic.status}</span><span className="topic-change">{topic.change}</span><ChevronRight size={15} /></Link>)}</div></section><section className="content-section"><SectionHeading eyebrow="Representative Shorts" title="Sample pattern before live scan" link={liveTrendHref({ category: category.name })} linkLabel="Retrieve live videos" /><div className="video-grid">{related.length ? related.map((video, index) => <ShortCard key={video.id} rank={index + 1} video={video} />) : sampleVideos.slice(0, 3).map((video, index) => <ShortCard key={video.id} rank={index + 1} video={video} />)}</div></section></>; }

export function ShortCard({ video, rank, saved, onSave }: { video: ShortVideo; rank?: number; saved?: boolean; onSave?: () => void }) {
  const savedIds = JSON.parse(useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot)) as string[];
  const isSaved = saved ?? savedIds.includes(video.id);
  function toggleSave() {
    if (onSave) return onSave();
    const next = isSaved ? savedIds.filter((item) => item !== video.id) : [...savedIds, video.id];
    writeSavedIds(next);
  }
  const tags = [video.category, video.topic, video.format].filter(Boolean).slice(0, 3);
  const videoKind = video.videoKind ?? (isShortVideo(video) ? "Shorts" : "Long");
  return <article className={`short-card ${videoKind === "Long" ? "long-card" : ""}`}><Link href={`/trending/${video.id}`} className="short-thumb"><Image src={displayThumbnail(video)} alt={video.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" unoptimized priority={Boolean(rank && rank <= 4)} /><div className="short-thumb-top"><span>#{rank ?? "-"}</span><strong>{video.velocity > 0 ? `+${video.velocity}%` : "First observation"}</strong></div><span className="format-pill">{videoKind}</span><span className="thumb-play"><Play size={13} fill="currentColor" /></span><span className="duration">{formatDuration(video.durationSeconds)}</span></Link><div className="short-body"><div className="short-title-row"><Link href={`/trending/${video.id}`} className="short-title">{video.title}</Link><button className={`save-button ${isSaved ? "save-active" : ""}`} onClick={toggleSave} aria-label={isSaved ? "Remove from saved" : "Save video"} title={isSaved ? "Remove from saved" : "Save video"}><Bookmark size={15} fill={isSaved ? "currentColor" : "none"} /></button></div><p className="short-channel"><span className="channel-dot" />{video.channel}<span>/</span>{video.publishedAt}</p><div className="short-metrics"><span><Eye size={13} /> {compact(video.views)}</span><span><Heart size={13} /> {compact(video.likes)}</span><span><MessageCircle size={13} /> {compact(video.comments)}</span></div><div className="velocity-row"><Activity size={13} /><strong>{compact(video.viewsPerHour)} views/hour</strong><span>{video.engagement}% engagement</span></div><div className="short-tags"><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span><span className="kind-tag">{videoKind}</span><span className={video.taxonomySource === "ai" ? "ai-tag" : ""}>{video.taxonomySource === "ai" ? "AI category" : "Rule category"}</span>{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="short-actions"><button onClick={toggleSave}><Bookmark size={12} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}</button><a href={video.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> YouTube</a><Link href={`/trending/${video.id}`}>Details <ChevronRight size={12} /></Link></div></div></article>;
}

function ShortListRow({ video, rank }: { video: ShortVideo; rank: number }) {
  const videoKind = video.videoKind ?? (isShortVideo(video) ? "Shorts" : "Long");
  return <article className="short-list-row"><Link href={`/trending/${video.id}`} className="list-thumb"><Image src={displayThumbnail(video)} alt={video.title} fill sizes="140px" unoptimized /><span className="duration">{formatDuration(video.durationSeconds)}</span></Link><div className="list-main"><div className="list-title-line"><span className="rank-token">#{rank}</span><Link href={`/trending/${video.id}`}>{video.title}</Link></div><p><span>{video.channel}</span><span>{video.publishedAt}</span><span>{video.category}</span><span>{video.topic}</span></p></div><div className="list-metrics"><span><Eye size={13} /> {compact(video.views)}</span><span><Activity size={13} /> {compact(video.viewsPerHour)}/h</span><span><Heart size={13} /> {compact(video.likes)}</span></div><div className="list-tags"><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span><span className="kind-tag">{videoKind}</span><span className={video.taxonomySource === "ai" ? "ai-tag" : ""}>{video.taxonomySource === "ai" ? "AI category" : "Rules"}</span></div><div className="list-actions"><Link href={`/trending/${video.id}`} className="quiet-button">Details <ChevronRight size={12} /></Link><a href={video.sourceUrl} target="_blank" rel="noreferrer" className="quiet-button">YouTube <ExternalLink size={12} /></a></div></article>;
}

function displayThumbnail(video: ShortVideo): string {
  return video.thumbnail.startsWith("/") ? video.thumbnail : `/api/thumbnail?url=${encodeURIComponent(video.thumbnail)}`;
}

function CategoryPreview({ name, description, color, momentum, subtopics, videoCount, expanded }: (typeof categories)[number] & { expanded?: boolean }) { return <Link href={liveTrendHref({ category: name })} className={`category-card ${expanded ? "category-card-expanded" : ""}`}><div className="category-top"><span className="category-icon" style={{ color, borderColor: `${color}55` }}><Tag size={15} /></span><span className="category-momentum" style={{ color }}>+{momentum}% momentum</span></div><h3>{name}</h3><p>{description}</p><div className="category-subtopics">{subtopics.map((topic) => <span key={topic.name}>{topic.name} <b>{topic.change}</b></span>)}</div><div className="category-bottom"><span>{videoCount.toLocaleString()} signals</span><span>Scan live <ChevronRight size={13} /></span></div></Link>; }
function SectionHeading({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) { return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link && <Link href={link} className="text-link">{linkLabel} <ChevronRight size={14} /></Link>}</div>; }
export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function compact(value: number) { return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${Math.round(value / 1000)}K` : value.toString(); }
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }

function controlsFromParams(params: URLSearchParams | ReadonlyURLSearchParamsLike): TrendControlsState {
  return {
    ...defaultControls,
    sort: readOption(params.get("sort"), ["Hot", "Popular", "Latest"], defaultControls.sort),
    format: readOption(params.get("format"), ["All videos", "Shorts", "Long"], defaultControls.format),
    window: readOption(params.get("window"), ["24h", "3d", "7d", "14d"], defaultControls.window),
    language: readOption(params.get("language"), ["All", "English", "Hindi", "Hinglish", "Regional"], defaultControls.language),
    category: params.get("category") || defaultControls.category,
    query: params.get("q") || params.get("query") || defaultControls.query,
    visibleCount: Math.max(10, Math.min(50, Number(params.get("limit") ?? defaultControls.visibleCount))),
  };
}

type ReadonlyURLSearchParamsLike = Pick<URLSearchParams, "get">;

function filterFromParams(params: ReadonlyURLSearchParamsLike): string {
  const signal = params.get("signal") ?? "All signals";
  return signalFilters.includes(signal) ? signal : "All signals";
}

function readOption<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return value && options.includes(value as T) ? value as T : fallback;
}

function liveTrendHref(options: Partial<Pick<TrendControlsState, "category" | "format" | "window" | "language" | "query">> & { signal?: string } = {}): string {
  const params = new URLSearchParams({
    format: options.format ?? "Shorts",
    window: options.window ?? "7d",
    language: options.language ?? "All",
    category: options.category ?? "All",
    signal: options.signal ?? "All signals",
  });
  if (options.query?.trim()) params.set("q", options.query.trim());
  return `/trending?${params.toString()}`;
}
