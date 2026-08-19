"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bookmark, ChevronRight, Flame, Play, Plus, RotateCw, Sparkles, Tag, Zap } from "lucide-react";
import { categories, sampleVideos } from "@/lib/demo-data";
import type { ShortVideo } from "@/lib/types";

export function HomePage() {
  const [saved, setSaved] = useState<string[]>(() => typeof window === "undefined" ? [] : JSON.parse(window.localStorage.getItem("momentum-saved") ?? "[]"));
  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next); window.localStorage.setItem("momentum-saved", JSON.stringify(next));
  }
  const featured = sampleVideos[0];
  return <>
    <PageIntro eyebrow="India / Updated just now" title="What’s moving" description="A clear read on the Shorts formats gaining attention across India." action={<button className="quiet-button"><RotateCw size={14} /> Refresh signal</button>} />
    <div className="demo-notice"><span className="status-pulse" /> Sample fixture <span>Explore the product with representative Shorts. Connect YouTube to replace this with live evidence.</span><Link href="/settings">Configure source <ChevronRight size={13} /></Link></div>
    <section className="metric-strip" aria-label="Momentum summary">
      <Metric label="Signals tracked" value="2,480" note="India · last 24h" icon={<Zap size={16} />} />
      <Metric label="Rising now" value="+64%" note="AI agents" icon={<TrendingArrow />} accent />
      <Metric label="Fresh formats" value="18" note="Worth investigating" icon={<Sparkles size={16} />} />
      <Metric label="Your usage" value="12 / 20" note="Free plan today" icon={<BarMini />} />
    </section>

    <section className="feature-grid">
      <div className="feature-card" style={{ backgroundImage: `url(${featured.thumbnail})` }}>
        <div className="feature-shade" /><div className="feature-content"><div className="feature-top"><span className="trend-badge trend-exploding"><Flame size={12} /> Exploding</span><span className="sample-tag">Sample fixture</span></div><div><p className="feature-kicker">Signal of the moment</p><h2>{featured.title}</h2><p className="feature-meta">{featured.channel} <span>·</span> {featured.publishedAt} <span>·</span> {featured.viewsPerHour.toLocaleString()} views/hour</p><Link href={`/trending/${featured.id}`} className="light-button">See the signal <ArrowUpRight size={15} /></Link></div></div>
      </div>
      <div className="signal-brief panel-surface"><div className="section-heading"><div><p className="eyebrow">The read</p><h2>Why attention is shifting</h2></div><Link href="/trending" className="text-link">Full feed <ChevronRight size={14} /></Link></div><p className="brief-lede">Budget challenge formats are spreading across food and travel content because the constraint is instantly legible and the payoff is visible.</p><div className="brief-list"><BriefRow label="Format gaining ground" value="Budget challenge" change="+72%" color="lime" /><BriefRow label="Strongest audience cue" value="Price reveal" change="High" color="amber" /><BriefRow label="Best next move" value="Make the constraint local" change="Action" color="blue" /></div><Link href="/trending/short-01" className="brief-action">Understand this signal <ArrowUpRight size={14} /></Link></div>
    </section>

    <section className="content-section"><SectionHeading eyebrow="Highest momentum" title="Watch these now" link="/trending" linkLabel="View all" /><div className="video-grid">{sampleVideos.slice(0, 6).map((video) => <ShortCard key={video.id} video={video} saved={saved.includes(video.id)} onSave={() => toggleSave(video.id)} />)}</div></section>
    <section className="content-section"><SectionHeading eyebrow="AI-built map" title="Where the signal is gathering" link="/categories" linkLabel="Explore categories" /><div className="category-grid">{categories.slice(0, 3).map((category) => <CategoryPreview key={category.slug} {...category} />)}</div></section>
    <section className="locked-banner"><div><p className="eyebrow">The next layer</p><h2>Momentum is more useful when it remembers.</h2><p>Unlock historical movement, creator fit, and the difference between a spike and a durable format.</p></div><Link href="/pricing" className="primary-button">Unlock deeper intelligence <ChevronRight size={15} /></Link></section>
  </>;
}

export function TrendingPage() {
  const [filter, setFilter] = useState("All signals");
  const filters = ["All signals", "Exploding", "Rising", "Emerging", "Food", "AI & Tech"];
  const shown = sampleVideos.filter((video) => filter === "All signals" || video.label === filter || video.category === filter);
  return <><PageIntro eyebrow="Discover / India" title="What’s trending" description="The formats and Shorts earning unusual attention right now." action={<button className="primary-button"><Plus size={15} /> New niche search</button>} /><div className="filter-bar">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "filter-active" : ""}>{item}</button>)}</div><div className="result-meta"><span>{shown.length} signals in this view</span><span><span className="green-dot" /> Sample fixture · refreshed for demo</span></div><div className="video-grid video-grid-wide">{shown.map((video) => <ShortCard key={video.id} video={video} />)}</div></>;
}

export function CategoriesPage() { return <><PageIntro eyebrow="Intelligence / Pattern map" title="AI categories" description="A living map of the formats people are carrying from one niche into another." action={<button className="quiet-button"><Sparkles size={14} /> How categories work</button>} /><div className="category-grid category-grid-large">{categories.map((category) => <CategoryPreview key={category.slug} {...category} expanded />)}</div><div className="locked-banner compact"><div><p className="eyebrow">Creator plan</p><h2>Search the map by your niche.</h2><p>Go from a broad category to the exact subtopic worth watching.</p></div><Link href="/search" className="primary-button">Search a niche <ChevronRight size={15} /></Link></div></>; }

export function CategoryPage({ category }: { category: (typeof categories)[number] }) { const related = sampleVideos.filter((video) => video.category === category.name); return <><Link href="/categories" className="back-link">← All categories</Link><PageIntro eyebrow={`AI category / ${category.videoCount.toLocaleString()} signals`} title={category.name} description={category.description} action={<button className="quiet-button"><Bookmark size={14} /> Save category</button>} /><section className="category-hero panel-surface"><div className="category-score" style={{ "--score-color": category.color } as React.CSSProperties}><span>{category.momentum}</span><small>momentum</small></div><div><p className="eyebrow">What is moving inside this category</p><h2>Formats with enough signal to investigate.</h2><p>These are directional estimates from the current sample, not historical growth.</p></div></section><section className="content-section"><SectionHeading eyebrow="Emerging topics" title="Subtopics to watch" /><div className="topic-list">{category.subtopics.map((topic) => <Link href={`/search?query=${encodeURIComponent(topic.name)}`} key={topic.name} className="topic-row"><span className="topic-dot" style={{ backgroundColor: category.color }} /><strong>{topic.name}</strong><span className="topic-status">{topic.status}</span><span className="topic-change">{topic.change}</span><ChevronRight size={15} /></Link>)}</div></section><section className="content-section"><SectionHeading eyebrow="Representative Shorts" title="See the signal" /><div className="video-grid">{related.length ? related.map((video) => <ShortCard key={video.id} video={video} />) : sampleVideos.slice(0, 3).map((video) => <ShortCard key={video.id} video={video} />)}</div></section></>; }

export function ShortCard({ video, saved, onSave }: { video: ShortVideo; saved?: boolean; onSave?: () => void }) { return <article className="short-card"><Link href={`/trending/${video.id}`} className="short-thumb" style={{ backgroundImage: `url(${video.thumbnail})` }}><span className="thumb-play"><Play size={14} fill="currentColor" /></span><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span><span className="duration">0:{video.durationSeconds}</span></Link><div className="short-body"><div className="short-title-row"><Link href={`/trending/${video.id}`} className="short-title">{video.title}</Link><button className={`save-button ${saved ? "save-active" : ""}`} onClick={onSave} aria-label={saved ? "Remove from saved" : "Save Short"} title={saved ? "Remove from saved" : "Save Short"}><Bookmark size={15} fill={saved ? "currentColor" : "none"} /></button></div><p className="short-channel">{video.channel} <span>·</span> {video.publishedAt}</p><div className="short-stats"><span>{compact(video.views)} views</span><span>{compact(video.viewsPerHour)}/hr</span><strong>{video.momentumScore} <small>momentum</small></strong></div><div className="short-footer"><span className="sample-label">Sample fixture</span><Link href={`/trending/${video.id}`} className="card-link">See signal <ArrowUpRight size={13} /></Link></div></div></article>; }

function Metric({ label, value, note, icon, accent }: { label: string; value: string; note: string; icon: React.ReactNode; accent?: boolean }) { return <div className={`metric-cell ${accent ? "metric-accent" : ""}`}><span className="metric-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>; }
function BriefRow({ label, value, change, color }: { label: string; value: string; change: string; color: string }) { return <div className="brief-row"><span className={`brief-dot dot-${color}`} /><div><small>{label}</small><strong>{value}</strong></div><em>{change}</em></div>; }
function CategoryPreview({ slug, name, description, color, momentum, subtopics, videoCount, expanded }: (typeof categories)[number] & { expanded?: boolean }) { return <Link href={`/categories/${slug}`} className={`category-card ${expanded ? "category-card-expanded" : ""}`}><div className="category-top"><span className="category-icon" style={{ color, borderColor: `${color}55` }}><Tag size={15} /></span><span className="category-momentum" style={{ color }}>+{momentum}%</span></div><h3>{name}</h3><p>{description}</p><div className="category-subtopics">{subtopics.map((topic) => <span key={topic.name}>{topic.name} <b>{topic.change}</b></span>)}</div><div className="category-bottom"><span>{videoCount.toLocaleString()} Shorts</span><span>Explore <ChevronRight size={13} /></span></div></Link>; }
function SectionHeading({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) { return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link && <Link href={link} className="text-link">{linkLabel} <ChevronRight size={14} /></Link>}</div>; }
export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function compact(value: number) { return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${Math.round(value / 1000)}K` : value.toString(); }
function TrendingArrow() { return <span className="trend-arrow">↗</span>; }
function BarMini() { return <span className="bar-mini"><i /><i /><i /><i /></span>; }
