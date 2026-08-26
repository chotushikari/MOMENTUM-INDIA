"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Activity, BarChart3, Bookmark, ChevronDown, ChevronRight, ExternalLink, Eye, Grid2X2, Heart, List, LockKeyhole, MessageCircle, Music2, Play, RefreshCw, Search, Tag, Video, Zap } from "lucide-react";
import { categories, sampleVideos } from "@/lib/demo-data";
import { savedServerSnapshot, savedSnapshot, subscribeToSaved, toggleSavedVideo } from "@/lib/saved";
import type { ShortVideo, SourceMode, TrendScanMeta } from "@/lib/types";
import { ShortCardGridSkeleton, ShortListViewSkeleton } from "@/components/skeletons";

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
  const thirdVideo = videos[2] ?? sampleVideos[2] ?? topVideo;
  const proof = [
    { label: "Discovery", value: sourceMode === "live" ? `${videos.length}` : "Demo", note: sourceMode === "live" ? "current analyzed sample" : "sample fixture" },
    { label: "Signal", value: compact(topVideo.viewsPerHour), note: "views per hour, not just views" },
    { label: "Trust", value: "Scoped", note: "ranked from candidates analyzed" },
  ];
  return <main className="marketing-page">
    <nav className="marketing-nav" aria-label="MOMENTUM marketing navigation">
      <Link href="/" className="brand-lockup"><span className="brand-mark brand-letter">M</span><span>MOMENTUM</span></Link>
      <div>
        <Link href="/trending">What&apos;s moving</Link>
        <Link href="/categories">Niches</Link>
        <Link href="/methodology">Methodology</Link>
        <Link href="/pricing">Pricing</Link>
      </div>
      <Link href="/home" className="primary-button">Explore what&apos;s moving <ChevronRight size={14} /></Link>
    </nav>
    <section className="marketing-hero">
      <div className="marketing-copy">
        <p className="eyebrow"><span className="scan-dot" /> YouTube Shorts intelligence for India</p>
        <h1>Know what&apos;s moving before it&apos;s obvious.</h1>
        <p>MOMENTUM turns short-form signals into intelligence for creators and teams. Find what is moving, understand why it is moving, decide if it matters to you, then make something better.</p>
        <div className="hero-actions">
          <Link href="/home" className="primary-button">Explore what&apos;s moving <ChevronRight size={14} /></Link>
          <Link href="/methodology" className="quiet-button">See how MOMENTUM works</Link>
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
          <Link href={liveTrendHref({ category: topVideo.category, query: topVideo.topic })}><Search size={14} /><span>Scan similar</span><strong>{topVideo.category}</strong></Link>
          <Link href={liveTrendHref({ category: secondVideo.category, query: secondVideo.topic })}><BarChart3 size={14} /><span>Open niche</span><strong>{secondVideo.topic}</strong></Link>
        </div>
      </div>
    </section>
    {dataError && <div className="provider-error landing-error" role="status"><span>Source unavailable</span><strong>{dataError}</strong><Link href="/settings">Check configuration <ChevronRight size={13} /></Link></div>}
    <section className="marketing-section problem-section">
      <div className="problem-copy">
        <p className="eyebrow">The problem</p>
        <h2>By the time everyone sees a trend, it is already crowded.</h2>
        <p>YouTube shows popularity. MOMENTUM looks for movement inside the public candidates it can retrieve and enrich. Views tell you what happened. Momentum tells you what is changing.</p>
      </div>
      <div className="signal-example panel-surface">
        <div><span>Popular read</span><strong>{compact(topVideo.views)}</strong><small>total views</small></div>
        <ChevronRight size={18} />
        <div><span>Momentum read</span><strong>{compact(topVideo.viewsPerHour)}/h</strong><small>{topVideo.label.toLowerCase()} signal</small></div>
        <p>The second number is the useful one. It tells a creator whether a signal deserves attention now.</p>
      </div>
    </section>
    <section className="marketing-section">
      <SectionHeading eyebrow="Product flow" title="Discover, understand, decide, create" />
      <div className="marketing-workflow">{[
        ["Discover", "Find top MOMENTUM signals from the candidates analyzed."],
        ["Understand", "Open the video intelligence report and see hook, format, topic, lifecycle, and confidence."],
        ["Decide", "Score whether the opportunity fits your channel, audience, language, and timing."],
        ["Create", "Build concepts, hooks, scripts, captions, hashtags, and shot lists only when requested."],
      ].map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{text}</p></article>)}</div>
    </section>
    <section className="marketing-section product-preview-section">
      <SectionHeading eyebrow="Product screens" title="The app is the proof" />
      <div className="product-preview-grid">
        <Link href={liveTrendHref()}><span>Trending</span><strong>{topVideo.category}</strong><small>{compact(topVideo.viewsPerHour)} views/hour</small></Link>
        <Link href={`/trending/${topVideo.id}`}><span>Video intelligence</span><strong>{topVideo.label}</strong><small>{topVideo.format}</small></Link>
        <Link href={liveTrendHref({ category: secondVideo.category })}><span>Niche intelligence</span><strong>{secondVideo.category}</strong><small>{secondVideo.topic}</small></Link>
        <Link href="/ideas"><span>Content Assistant</span><strong>Make this useful</strong><small>Channel-aware creator plan</small></Link>
      </div>
    </section>
    <section className="marketing-section">
      <SectionHeading eyebrow="Built for" title="Creators first, teams next" />
      <div className="marketing-workflow marketing-use-grid">{[
        ["Creators", "Find your next topic and turn one signal into a production-ready concept."],
        ["Marketing teams", "Understand what audiences are responding to before planning content."],
        ["Agencies", "Compare emerging formats across client niches without claiming total platform coverage."],
        ["Trend researchers", "Inspect public signals, coverage, taxonomy, confidence, and ranking reasons."],
      ].map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}</div>
    </section>
    <section className="marketing-split">
      <div>
        <p className="eyebrow">Signal methodology</p>
        <h2>We rank the candidate pool, not the whole internet.</h2>
        <p>MOMENTUM builds an intelligence layer on top of public platform signals. Every scan separates retrieval, enrichment, intelligence filters, and ranking so users can see what was analyzed.</p>
        <Link href="/methodology" className="primary-button">Read methodology <ChevronRight size={14} /></Link>
      </div>
      <div className="marketing-category-board">
        {[
          ["YouTube Shorts", "Available", "India MVP"],
          ["Instagram Reels", "Coming soon", "Future adapter"],
          ["City intelligence", "Locked", "No fake local data"],
          ["Historical trends", "Locked", "Requires repeated snapshots"],
        ].map(([name, status, note]) => <Link href={status === "Available" ? liveTrendHref() : "/pricing"} key={name}><span>{name}</span><strong>{status}</strong><small>{note}</small></Link>)}
      </div>
    </section>
    <section className="marketing-section final-cta">
      <div>
        <h2>Find what is moving. Understand why. Make something better.</h2>
        <p>Start with India-wide YouTube Shorts intelligence today. Future platform, city, creator, and historical layers stay clearly marked until real evidence supports them.</p>
      </div>
      <Link href="/home" className="primary-button">Open MOMENTUM <ChevronRight size={14} /></Link>
      <Link href={liveTrendHref({ category: thirdVideo.category, query: thirdVideo.topic })} className="quiet-button">Inspect a signal</Link>
    </section>
  </main>;
}

export function HomePage({ videos = sampleVideos, sourceMode = "demo", dataError }: { videos?: ShortVideo[]; sourceMode?: SourceMode; dataError?: string }) {
  const saved = JSON.parse(useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot)) as string[];
  function toggleSave(id: string) {
    const video = videos.find((item) => item.id === id) ?? sampleVideos.find((item) => item.id === id);
    if (video) toggleSavedVideo(video);
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
  const [scanMeta, setScanMeta] = useState<TrendScanMeta | null>(null);
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
        .then((response) => response.ok ? response.json() as Promise<{ items?: ShortVideo[]; meta?: TrendScanMeta }> : Promise.reject())
        .then((payload) => {
          setItems(payload.items ?? []);
          setScanMeta(payload.meta ?? null);
        })
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
  const filtered = sourceMode === "live"
    ? sortVideos(items.filter((video) => filter === "All signals" || video.label === filter || video.category === filter), controls.sort)
    : sortVideos(items.filter((video) => matchesControls(video, controls) && (filter === "All signals" || video.label === filter || video.category === filter)), controls.sort);
  const shown = filtered.slice(0, controls.visibleCount);
  async function loadMore() {
    setLoadingMore(true);
    setLoadError("");
    try {
      const nextLimit = Math.min(50, Math.max(items.length + 10, controls.visibleCount + 10));
      const response = await fetch(`/api/trends?${trendQuery(controls, filter, nextLimit)}`);
      const payload = await response.json() as { items?: ShortVideo[]; meta?: TrendScanMeta };
      if (!response.ok || !payload.items) throw new Error();
      const merged = [...items, ...payload.items.filter((video) => !items.some((existing) => existing.id === video.id))];
      setItems(merged);
      setScanMeta(payload.meta ?? null);
      setControls((current) => ({ ...current, visibleCount: Math.min(50, current.visibleCount + 10) }));
    } catch {
      setLoadError("Could not retrieve more videos right now.");
    } finally {
      setLoadingMore(false);
    }
  }
  return <><section className="trend-workspace-heading"><div><p className="eyebrow">MOMENTUM INTELLIGENCE PIPELINE / {sourceMode === "live" ? "LIVE SOURCE" : "DEMO MODE"}</p><h1>What Should I Make Next?</h1><p>Define creator context, scan emerging attention velocity, prove the signal, decode the viral pattern, and generate an original script.</p></div><div className="trend-heading-actions"><button className="primary-button scan-button" onClick={() => setScanNonce((value) => value + 1)} disabled={scanning}><RefreshCw size={14} className={scanning ? "spin" : ""} /> {scanning ? "SCAN OPPORTUNITIES ⚡" : "Scan again"}</button><Link href="/search" className="quiet-button"><Search size={14} /> Search niche</Link></div></section>

  {/* Interactive 5-Stage Creator Workflow Header */}
  <div className="workflow-stepper-container">
    <div className="workflow-stepper-header">
      <span className="eyebrow">CREATOR WORKFLOW</span>
      <strong>SIGNAL → PATTERN → OPPORTUNITY → ACTION</strong>
    </div>
    <div className="workflow-stepper-grid">
      <div className="workflow-step workflow-step-active">
        <span className="step-num">1</span>
        <div className="step-body">
          <strong>CONTEXT</strong>
          <small>Niche · Audience · Region</small>
        </div>
      </div>
      <span className="step-arrow">→</span>
      <div className="workflow-step">
        <span className="step-num">2</span>
        <div className="step-body">
          <strong>DISCOVER</strong>
          <small>Emerging · Rising · Breakouts</small>
        </div>
      </div>
      <span className="step-arrow">→</span>
      <div className="workflow-step">
        <span className="step-num">3</span>
        <div className="step-body">
          <strong>PROVE SIGNAL</strong>
          <small>Velocity · Engagement · Recency</small>
        </div>
      </div>
      <span className="step-arrow">→</span>
      <div className="workflow-step">
        <span className="step-num">4</span>
        <div className="step-body">
          <strong>DECODE PATTERN</strong>
          <small>Hook · Format · Emotion</small>
        </div>
      </div>
      <span className="step-arrow">→</span>
      <div className="workflow-step">
        <span className="step-num">5</span>
        <div className="step-body">
          <strong>GENERATE CONCEPT</strong>
          <small>Hook · Remix Idea · Beats</small>
        </div>
      </div>
    </div>
  </div>

  {/* Quick Preset Scan Selectors */}
  <div className="preset-quick-scans">
    <span>Quick Niche Scans:</span>
    <button type="button" className={controls.category === "AI & Tech" ? "preset-active" : ""} onClick={() => setControls((c) => ({ ...c, category: "AI & Tech", window: "24h", query: "AI agents" }))}>⚡ AI Agents (24h)</button>
    <button type="button" className={controls.category === "Food" ? "preset-active" : ""} onClick={() => setControls((c) => ({ ...c, category: "Food", window: "24h", query: "street food" }))}>⚡ Street Food (24h)</button>
    <button type="button" className={controls.category === "Fitness" ? "preset-active" : ""} onClick={() => setControls((c) => ({ ...c, category: "Fitness", window: "24h", query: "desk workout" }))}>⚡ Desk Workout (24h)</button>
    <button type="button" className={controls.category === "Finance" ? "preset-active" : ""} onClick={() => setControls((c) => ({ ...c, category: "Finance", window: "24h", query: "salary breakdown" }))}>⚡ Salary Breakdown (24h)</button>
  </div>
  <SourceTabs /><TrendControls state={controls} onChange={(next) => setControls((current) => ({ ...current, ...next, visibleCount: next.visibleCount ?? 10 }))} /><div className="filter-bar secondary-filters">{signalFilters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "filter-active" : ""}>{item}</button>)}</div>{dataError && <div className="provider-error" role="status"><span>Source unavailable</span><strong>{dataError}</strong><Link href="/settings">Check configuration <ChevronRight size={13} /></Link></div>}<div className="workspace-results"><div><span className={scanning ? "scan-dot is-scanning" : "green-dot"} /> {scanning ? "Scanning YouTube..." : scanResultSummary(filtered.length, items.length, scanMeta)} <span>/</span> {sourceMode === "live" ? `Filters: ${activeScanSummary(controls, filter, scanMeta)}` : "Sample fixture"} <span>/</span> {scanMeta?.rankingMethod ?? "Momentum ranking within analyzed candidates"}</div><div className="sample-label">{scanMeta?.coverageConfidence ? `${scanMeta.coverageConfidence.toUpperCase()} COVERAGE` : `YOUTUBE ${controls.format === "All videos" ? "VIDEOS" : controls.format.toUpperCase()}`}</div></div>{scanMeta && <div className="coverage-strip" aria-label="Discovery coverage"><span><strong>{scanMeta.retrievedCount ?? scanMeta.candidatePool}</strong> retrieved</span><span><strong>{scanMeta.enrichedCount ?? scanMeta.candidatePool}</strong> enriched</span><span><strong>{scanMeta.matchedCount ?? scanMeta.exactMatches}</strong> matched</span><span><strong>{scanMeta.shownCount ?? scanMeta.returned}</strong> shown</span>{scanMeta.cacheHit && <span className="cache-hit-pill">cache hit</span>}</div>}{scanMeta?.note && <div className="scan-note" role="status">{scanMeta.note}</div>}
{scanning ? (
  controls.view === "Grid" ? <ShortCardGridSkeleton count={controls.visibleCount} /> : <ShortListViewSkeleton count={controls.visibleCount} />
) : shown.length ? (
  controls.view === "Grid" ? (
    <div className={`video-grid video-grid-wide reference-video-grid ${controls.density === "Comfortable" ? "video-grid-comfortable" : ""}`}>
      {shown.map((video, index) => <ShortCard key={video.id} rank={index + 1} video={video} />)}
    </div>
  ) : (
    <div className="video-list-view">
      {shown.map((video, index) => <ShortListRow key={video.id} rank={index + 1} video={video} />)}
    </div>
  )
) : (
  <div className="search-empty trend-empty">
    <div className="search-empty-icon"><Search size={22} /></div>
    <h2>No videos matched this combination.</h2>
    <p>{emptyStateText(scanMeta)}</p>
    <div className="empty-suggestions">
      <span>Try removing AI taxonomy</span>
      <span>Expand to 7d or 14d</span>
      <span>Switch category or format</span>
    </div>
  </div>
)}<div className="load-more-panel">{loadError && <span>{loadError}</span>}<button className="quiet-button" onClick={loadMore} disabled={loadingMore || scanning || controls.visibleCount >= 50}>{loadingMore ? "Retrieving..." : shown.length < filtered.length ? "Show more matches" : "Retrieve more videos"} <ChevronRight size={14} /></button></div></>;
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

function activeScanSummary(controls: TrendControlsState, filter: string, meta?: TrendScanMeta | null): string {
  return [controls.query && `"${controls.query}"`, controls.format, meta?.effectiveWindow && meta.effectiveWindow !== controls.window ? `${controls.window} expanded to ${meta.effectiveWindow}` : controls.window, controls.language !== "All" && controls.language, categoryForRequest(controls, filter) !== "All" && categoryForRequest(controls, filter), signalForRequest(filter) !== "All signals" && signalForRequest(filter), "AI taxonomy"].filter(Boolean).join(" / ");
}

function scanResultSummary(filteredCount: number, itemCount: number, meta?: TrendScanMeta | null): string {
  if (!meta) return `${filteredCount} matching signals / ${itemCount} retrieved`;
  if (meta.matchMode === "expanded-window") return `${meta.exactMatches} exact / ${filteredCount} shown / ${meta.enrichedCount ?? meta.candidatePool} analyzed`;
  if (meta.matchMode === "adjacent") return `${meta.matchedCount ?? filteredCount} adjacent / ${meta.shownCount ?? meta.returned} shown / ${meta.enrichedCount ?? meta.candidatePool} analyzed`;
  return `${meta.matchedCount ?? filteredCount} matched / ${meta.shownCount ?? meta.returned} shown / ${meta.enrichedCount ?? meta.candidatePool} analyzed`;
}

function emptyStateText(meta?: TrendScanMeta | null): string {
  if (!meta) return "Your filters are narrower than the current discovery sample. MOMENTUM will not fill gaps with fake trend data.";
  if ((meta.retrievedCount ?? 0) === 0) return "The source did not return a usable candidate pool for this retrieval plan.";
  if ((meta.enrichedCount ?? 0) === 0) return "Candidates were retrieved, but video details could not be enriched for this sample.";
  return "Your filters are narrower than the current discovery sample after enrichment and classification.";
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
    if (sort === "Popular") return b.views - a.views || b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour;
    if (sort === "Latest") return Date.parse(b.rawPublishedAt ?? b.publishedAt) - Date.parse(a.rawPublishedAt ?? a.publishedAt) || ageHours(a.publishedAt) - ageHours(b.publishedAt);
    return b.momentumScore - a.momentumScore || b.viewsPerHour - a.viewsPerHour || b.views - a.views;
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
    toggleSavedVideo(video);
  }
  const tags = [video.category, video.topic, video.format].filter(Boolean).slice(0, 3);
  const videoKind = video.videoKind ?? (isShortVideo(video) ? "Shorts" : "Long");
  return <article className={`short-card ${videoKind === "Long" ? "long-card" : ""}`}>
    <Link href={`/trending/${video.id}`} className="short-thumb">
      <Image src={displayThumbnail(video)} alt={video.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" unoptimized priority={Boolean(rank && rank <= 4)} />
      <div className="short-thumb-top">
        <span className="rank-pill">#{rank ?? "-"}</span>
        <span className="velocity-badge"><Zap size={11} /> {video.velocity > 0 ? `+${video.velocity}%` : `${compact(video.viewsPerHour)}/h`}</span>
      </div>
      <span className="format-pill">{videoKind}</span>
      <span className="thumb-play"><Play size={13} fill="currentColor" /></span>
      <span className="duration tabular-nums">{formatDuration(video.durationSeconds)}</span>
    </Link>
    <div className="short-body">
      <div className="short-title-row">
        <Link href={`/trending/${video.id}`} className="short-title">{video.title}</Link>
        <button className={`save-button ${isSaved ? "save-active" : ""}`} onClick={toggleSave} aria-label={isSaved ? "Remove from saved" : "Save video"} title={isSaved ? "Remove from saved" : "Save video"}>
          <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="short-channel"><span className="channel-dot" />{video.channel}<span>/</span>{video.publishedAt}</p>
      <div className="short-metrics tabular-nums">
        <span><Eye size={13} /> {compact(video.views)}</span>
        <span><Heart size={13} /> {compact(video.likes)}</span>
        <span><MessageCircle size={13} /> {compact(video.comments)}</span>
      </div>
      <div className="velocity-row tabular-nums">
        <Activity size={13} />
        <strong>{compact(video.viewsPerHour)} views/hour</strong>
        <span>{video.engagement}% engagement</span>
      </div>
      {video.rankReason && <p className="rank-reason">{video.rankReason}</p>}
      <div className="short-tags">
        <span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span>
        <span className="kind-tag">{videoKind}</span>
        {video.rankConfidence && <span className={`evidence-tag evidence-${video.rankConfidence.toLowerCase()}`}>{video.rankConfidence} evidence</span>}
        <span className={video.taxonomySource === "ai" ? "ai-tag" : ""}>{video.taxonomySource === "ai" ? "AI category" : "Rule category"}</span>
        {tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="short-actions">
        <Link href={`/trending/${video.id}`} className="card-decode-button">Decode Pattern →</Link>
        <button onClick={toggleSave} aria-label={isSaved ? "Saved" : "Save"} title={isSaved ? "Saved" : "Save"}><Bookmark size={12} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}</button>
        <a href={video.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> YouTube</a>
      </div>
    </div>
  </article>;
}

function ShortListRow({ video, rank }: { video: ShortVideo; rank: number }) {
  const videoKind = video.videoKind ?? (isShortVideo(video) ? "Shorts" : "Long");
  return <article className="short-list-row"><Link href={`/trending/${video.id}`} className="list-thumb"><Image src={displayThumbnail(video)} alt={video.title} fill sizes="140px" unoptimized /><span className="duration">{formatDuration(video.durationSeconds)}</span></Link><div className="list-main"><div className="list-title-line"><span className="rank-token">#{rank}</span><Link href={`/trending/${video.id}`}>{video.title}</Link></div><p><span>{video.channel}</span><span>{video.publishedAt}</span><span>{video.category}</span><span>{video.topic}</span>{video.rankConfidence && <span>{video.rankConfidence} evidence</span>}</p></div><div className="list-metrics"><span><Eye size={13} /> {compact(video.views)}</span><span><Activity size={13} /> {compact(video.viewsPerHour)}/h</span><span><Heart size={13} /> {compact(video.likes)}</span></div><div className="list-tags"><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span><span className="kind-tag">{videoKind}</span><span className={video.taxonomySource === "ai" ? "ai-tag" : ""}>{video.taxonomySource === "ai" ? "AI category" : "Rules"}</span></div><div className="list-actions"><Link href={`/trending/${video.id}`} className="quiet-button">Details <ChevronRight size={12} /></Link><a href={video.sourceUrl} target="_blank" rel="noreferrer" className="quiet-button">YouTube <ExternalLink size={12} /></a></div></article>;
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
