"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Activity, Bookmark, Check, ChevronRight, ExternalLink, Hash, LockKeyhole, PenLine, Play, RefreshCw, Search, Sparkles, Target, Zap, FileText } from "lucide-react";
import { sampleVideos } from "@/lib/demo-data";
import { readSavedIdeas, readSavedVideos, savedServerSnapshot, savedSnapshot, subscribeToSaved, toggleSavedIdea, toggleSavedVideo } from "@/lib/saved";
import { getDailyUsage, plans } from "@/lib/entitlements";
import { buildCreatorActionPlan, type CreatorActionPlan, type CreatorOutputMode } from "@/lib/intelligence/creator-engine";
import { determineTrendLifecycle } from "@/lib/intelligence/lifecycle";
import { buildContentOpportunity, defaultCreatorProfile, type CreatorProfile } from "@/lib/intelligence/opportunity-engine";
import { buildNicheStrategyReport } from "@/lib/intelligence/niche-strategy-agent";
import { buildHookEngine, buildScriptEngine, buildHashtagEngine, type ScriptLength } from "@/lib/intelligence/script-hook-agent";
import type { ShortVideo, SourceMode } from "@/lib/types";
import { PageIntro, ShortCard } from "@/components/dashboard";
import { DeepDiveSkeleton, IdeasSkeleton, SearchReportSkeleton } from "@/components/skeletons";

type GroundedInsight = { why: string; hook: string; format: string; payoff: string; creatorPlan?: CreatorActionPlan };

export function SearchPage({ initialQuery, initialItems = sampleVideos, sourceMode = "demo" }: { initialQuery: string; initialItems?: ShortVideo[]; sourceMode?: SourceMode }) {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [liveItems, setLiveItems] = useState<ShortVideo[] | null>(null);
  const [searching, setSearching] = useState(false);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
    setSubmitted(initialQuery);
  }

  useEffect(() => {
    if (!submitted.trim()) return;
    let active = true;
    if (sourceMode === "live") {
      fetch(`/api/trends?q=${encodeURIComponent(submitted.trim())}&limit=20`)
        .then((res) => (res.ok ? res.json() as Promise<{ items?: ShortVideo[] }> : Promise.reject()))
        .then((payload) => {
          if (active) setLiveItems(payload.items ?? []);
        })
        .catch(() => {
          if (active) setLiveItems([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    } else {
      const timer = window.setTimeout(() => {
        if (active) setSearching(false);
      }, 150);
      return () => window.clearTimeout(timer);
    }
    return () => {
      active = false;
    };
  }, [submitted, sourceMode]);

  function handleSearchSubmit(term: string) {
    const trimmed = term.trim();
    setSubmitted(trimmed);
    if (trimmed) setSearching(true);
    else setLiveItems(null);
  }

  const pool = liveItems ?? initialItems;
  const results = useMemo(
    () => (submitted ? pool.filter((video) => `${video.title} ${video.topic} ${video.category} ${video.channel} ${video.format}`.toLowerCase().includes(submitted.toLowerCase())) : []),
    [pool, submitted]
  );
  const adjacent = pool.filter((video) => !results.some((result) => result.id === video.id)).slice(0, Math.max(0, 4 - results.length));
  const visible = submitted ? (results.length ? results.slice(0, 8) : adjacent.slice(0, 4)) : [];
  const avgMomentum = visible.length ? Math.round(visible.reduce((total, video) => total + video.momentumScore, 0) / visible.length) : 0;
  const topTopics = Array.from(new Set(visible.flatMap((video) => [video.topic, video.format, video.category]))).slice(0, 5);

  return (
    <>
      <PageIntro eyebrow="RADAR / NICHE INTELLIGENCE" title="Search a niche" description="Move from a broad idea to the Shorts, formats, and creator signals worth inspecting." />
      <form className="niche-search" onSubmit={(event) => { event.preventDefault(); handleSearchSubmit(query); }}>
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: budget travel, AI agents, college meals" aria-label="Search a niche" />
        <button className="primary-button" type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search signal"}
        </button>
      </form>
      <div className="search-suggestions">
        <span>Try a starting point</span>
        {["AI agents", "Delhi street food", "Beginner gym", "Student meals"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuery(item);
              handleSearchSubmit(item);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      {searching ? (
        <SearchReportSkeleton />
      ) : submitted ? (
        <>
          <section className="radar-summary panel-surface">
            <div>
              <p className="eyebrow">NICHE REPORT</p>
              <h2>{submitted}</h2>
              <p>{results.length ? "A focused signal set was found. Adjacent signals fill the report when the exact cluster is still thin." : "No exact cluster yet. Showing adjacent signals so the radar still has useful direction."}</p>
            </div>
            <div className="radar-score">
              <strong>{avgMomentum}</strong>
              <span>avg momentum</span>
            </div>
            <div className="radar-tags">
              {topTopics.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
          </section>
          <div className="result-meta">
            <span>{results.length} exact matches / {adjacent.length} adjacent signals for <strong>{submitted}</strong></span>
            <span><span className="green-dot" /> {sourceMode === "live" ? "Observed YouTube evidence" : "Sample fixture"}</span>
          </div>
          <div className="video-grid reference-video-grid">
            {visible.map((video, index) => (
              <ShortCard key={video.id} rank={index + 1} video={video} />
            ))}
          </div>
        </>
      ) : (
        <div className="search-empty">
          <div className="search-empty-icon"><Search size={22} /></div>
          <h2>Start with a market, format, or creator question.</h2>
          <p>Search is the fastest way to move from a category to a useful content angle.</p>
        </div>
      )}
    </>
  );
}

export function DeepDivePage({ video }: { video: ShortVideo }) {
  const [tab, setTab] = useState<"why" | "dna" | "ideas" | "hub">("why");
  const savedIds = JSON.parse(useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot)) as string[];
  const isSaved = savedIds.includes(video.id);
  const [insight, setInsight] = useState<GroundedInsight | null>(video.sourceMode === "demo" ? demoInsight(video) : null);
  const [insightError, setInsightError] = useState(false);
  const localRelated = sampleVideos.filter((item) => item.id !== video.id && (item.category === video.category || item.topic === video.topic)).slice(0, 6);
  const [relatedVideos, setRelatedVideos] = useState<ShortVideo[]>(localRelated.length ? localRelated : sampleVideos.filter((item) => item.id !== video.id).slice(0, 6));
  const [relatedStatus, setRelatedStatus] = useState(video.sourceMode === "live" ? "Retrieving similar videos" : "Sample fixture");
  const creatorPlan = insight?.creatorPlan ?? buildCreatorActionPlan(video);
  const lifecycle = determineTrendLifecycle(video);
  const opportunity = buildContentOpportunity(video);
  const relatedCategoryCount = relatedVideos.filter((item) => item.category === video.category).length;
  const relatedFormatCount = relatedVideos.filter((item) => item.videoKind === video.videoKind || item.format === video.format).length;

  useEffect(() => {
    if (video.sourceMode !== "live") return;
    let active = true;
    fetch(`/api/videos/${video.id}/insights`)
      .then((response) => response.ok ? response.json() as Promise<{ interpretation?: GroundedInsight }> : Promise.reject())
      .then((payload) => { if (active && payload.interpretation) setInsight(payload.interpretation); })
      .catch(() => { if (active) setInsightError(true); });
    return () => { active = false; };
  }, [video.id, video.sourceMode]);

  useEffect(() => {
    if (video.sourceMode !== "live") return;
    let active = true;
    const params = new URLSearchParams({ limit: "24", format: video.videoKind ?? "Shorts", language: "All", window: "14d", sort: "Hot" });
    const timer = window.setTimeout(() => {
      setRelatedStatus("Retrieving similar videos");
      fetch(`/api/videos/${video.id}/related?${params.toString()}`)
        .then((response) => response.ok ? response.json() as Promise<{ items?: ShortVideo[] }> : Promise.reject())
        .then((payload) => {
          if (!active) return;
          setRelatedVideos((payload.items ?? []).slice(0, 12));
          setRelatedStatus(`${payload.items?.length ?? 0} live related videos`);
        })
        .catch(() => {
          if (active) setRelatedStatus("Related scan unavailable");
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [video.id, video.sourceMode, video.videoKind]);

  if (video.sourceMode === "live" && insight === null && !insightError) {
    return <>
      <Link href="/trending" className="back-link">← Back to overview</Link>
      <DeepDiveSkeleton />
    </>;
  }

  return <>
    <Link href="/trending" className="back-link">← Back to overview</Link>
    <section className="deep-hero panel-surface">
      <div className="deep-hero-copy"><p className="eyebrow">VIDEO INSIGHTS / {video.sourceMode === "live" ? "LIVE SOURCE" : "SAMPLE FIXTURE"}</p><h1>{video.title}</h1><p className="deep-meta"><strong>{video.channel}</strong><span>Published {video.publishedAt}</span><span>{video.videoKind ?? "Shorts"}</span><span>{video.category}</span><span>{video.format}</span>{video.language && <span>{video.language}</span>}</p><div className="deep-actions"><Link href={`/ideas?videoId=${video.id}`} className="primary-button"><PenLine size={14} /> Make this for my channel</Link><button className={`quiet-button ${isSaved ? "save-active" : ""}`} onClick={() => toggleSavedVideo(video)} aria-label={isSaved ? "Remove from saved" : "Save video"}><Bookmark size={14} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}</button><a href={video.sourceUrl} target="_blank" rel="noreferrer" className="quiet-button">Watch on YouTube <ExternalLink size={13} /></a></div></div>

      <a href={video.sourceUrl} target="_blank" rel="noreferrer" className="deep-video" style={{ backgroundImage: `url(${displayThumbnail(video)})` }} aria-label="Watch source video on YouTube"><span className="deep-play"><Play size={22} fill="currentColor" /></span><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span></a>
    </section>
    <section className="deep-metric-strip panel-surface tabular-nums"><Insight label="Views" value={compact(video.views)} /><Insight label="Views / hour" value={compact(video.viewsPerHour)} /><Insight label="Like rate" value={`${video.views ? (video.likes / video.views * 100).toFixed(2) : "0.00"}%`} /><Insight label="Comment rate" value={`${video.views ? (video.comments / video.views * 100).toFixed(2) : "0.00"}%`} /><Insight label="Length" value={formatDuration(video.durationSeconds)} /><Insight label="Momentum" value={`${video.momentumScore}/100`} /></section>
    <section className="intelligence-report-grid">
      <article className="report-card panel-surface"><span>Lifecycle</span><strong>{lifecycle.stage}</strong><p>{lifecycle.reason}</p><em>{lifecycle.urgency}</em></article>
      <article className="report-card panel-surface"><span>Opportunity</span><strong>{opportunity.score}/100</strong><p>{opportunity.recommendation}</p><em>{opportunity.competition} competition</em></article>
      <article className="report-card panel-surface"><span>Creator move</span><strong>{opportunity.difficulty}</strong><p>{lifecycle.action}</p><em>{lifecycle.timing}</em></article>
    </section>
    <div className="deep-tabs">{([["why", "Why it works"], ["dna", "Pattern DNA"], ["ideas", "Creator actions"], ["hub", "Creator Hub ✦"]] as const).map(([id, label]) => <button key={id} className={tab === id ? "deep-tab-active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="deep-insight panel-surface">{tab === "why" && <><p className="eyebrow">AI interpretation / grounded in observed fields</p><h2>Why this is moving</h2>{insightError ? <p className="insight-lede">Grounded intelligence is temporarily unavailable. The observed evidence remains available above.</p> : <p className="insight-lede">{insight?.why ?? "Interpreting the observed evidence..."}</p>}<div className="insight-grid"><Insight label="Hook" value={insight?.hook ?? "Awaiting grounded interpretation"} /><Insight label="Format" value={insight?.format ?? video.format} /><Insight label="Viewer payoff" value={insight?.payoff ?? "Awaiting grounded interpretation"} /><Insight label="Evidence" value={video.rankReason ?? `${video.views.toLocaleString()} views / ${video.likes.toLocaleString()} likes / ${video.comments.toLocaleString()} comments`} /></div></>}{tab === "dna" && <><p className="eyebrow">Pattern breakdown</p><h2>The repeatable mechanics</h2><div className="dna-list"><Dna label="Opening promise" text={creatorPlan.hook} /><Dna label="Audience fit" text={creatorPlan.audience} /><Dna label="Niche mechanics" text={creatorPlan.nicheMechanics.join(" ")} /><Dna label="Momentum read" text={video.rankReason ?? `${compact(video.viewsPerHour)} views per hour suggests the signal deserves inspection now.`} /><Dna label="Evidence boundary" text="This is a current-source reading, not a claim of historical growth unless repeated snapshots exist." /></div></>}{tab === "ideas" && <><p className="eyebrow">Creator action</p><h2>Make an original high-signal version</h2><div className="creator-plan-grid"><PlanBlock title="Remake angles" items={creatorPlan.remakeAngles} /><PlanBlock title="Title frames" items={creatorPlan.titleFrames} /><PlanBlock title="Script beats" items={creatorPlan.scriptBeats} /><PlanBlock title="Remix scripts" items={creatorPlan.remixScripts} /><PlanBlock title="Hashtags" items={creatorPlan.hashtags} /><PlanBlock title="Validation checks" items={creatorPlan.validationPlan} /></div><div className="creator-direction"><strong>Thumbnail and description direction</strong><p>{creatorPlan.thumbnailDirection}</p><p>{creatorPlan.descriptionDraft}</p></div><Link href={`/ideas?videoId=${video.id}`} className="primary-button">Open in AI Studio <ChevronRight size={14} /></Link></> }{tab === "hub" && <CreatorActionHub video={video} relatedVideos={relatedVideos} />}</div>
    <section className="deep-two-column"><div className="panel-surface evidence-table"><div className="section-heading"><div><p className="eyebrow">Observed details</p><h2>What the source says</h2></div></div><div className="detail-rows"><span>Channel</span><strong>{video.channel}</strong><span>Topic</span><strong>{video.topic}</strong><span>Format</span><strong>{video.format}</strong><span>Category</span><strong>{video.category}</strong><span>Category source</span><strong>{video.taxonomySource === "ai" ? "AI taxonomy" : "Rule fallback"}</strong><span>Evidence strength</span><strong>{video.rankConfidence ?? "Unknown"} / {video.evidenceScore ?? video.momentumScore}</strong><span>Ranking reason</span><strong>{video.rankReason ?? "Source metrics normalized by recency and engagement"}</strong><span>Source</span><strong>{video.sourceMode === "live" ? "YouTube API" : "Sample fixture"}</strong></div><p>{video.categoryReason ?? video.why}</p></div><aside className="panel-surface momentum-next"><p className="eyebrow">Extra layer</p><h2>What we add beyond a trend list</h2><div className="dna-list"><Dna label="Banger brief" text={creatorPlan.thesis} /><Dna label="Opportunity score" text={`${opportunity.score}/100. ${opportunity.why.join(" ")}`} /><Dna label="Risk checks" text={opportunity.risks.join(" ")} /><Dna label="Action memory" text="Save the signal, turn it into ideas, and return to the same source context later." /></div></aside></section>
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">Related signals</p><h2>Similar videos retrieved from this signal</h2></div><span className="sample-label">{relatedStatus}</span></div>{relatedVideos.length ? <><div className="related-quality-row"><span>{relatedCategoryCount} share category</span><span>{relatedFormatCount} share format</span><span>{relatedVideos.length} inspectable sources</span></div><div className="video-grid reference-video-grid related-grid">{relatedVideos.map((item, index) => <ShortCard key={item.id} rank={index + 1} video={item} />)}</div></> : <div className="search-empty trend-empty"><div className="search-empty-icon"><Search size={22} /></div><h2>No similar videos returned.</h2><p>The source video is still available above; MOMENTUM will not invent related signals.</p></div>}</section>
  </>;
}

export function IdeasPage({ video = sampleVideos[0], sourceMode = "demo", preselectedVideoId }: { video?: ShortVideo; sourceMode?: SourceMode; preselectedVideoId?: string }) {
  const defaultBrief = `A YouTube Short based on: ${video.title}`;
  const [brief, setBrief] = useState(defaultBrief);
  const [outputMode, setOutputMode] = useState<CreatorOutputMode>("Explore");
  const [profile, setProfile] = useState<CreatorProfile>(defaultCreatorProfile);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [ideas, setIdeas] = useState<{ title: string; rationale: string }[]>([]);
  const [plan, setPlan] = useState<CreatorActionPlan>(buildCreatorActionPlan(video, defaultCreatorProfile));
  const opportunity = buildContentOpportunity(video, profile);
  const depthActions: { label: string; mode: CreatorOutputMode; prompt: string }[] = [
    { label: "Analyze deeper", mode: "Explore", prompt: "Explain the opportunity, risks, and validation steps." },
    { label: "Give me concepts", mode: "Plan", prompt: "Give me distinct concepts with why, difficulty, and risk." },
    { label: "Write the hook", mode: "Write", prompt: "Write 5 hook options and choose the strongest one." },
    { label: "Write the script", mode: "Write", prompt: "Write a short production-ready script with beats and visual direction." },
    { label: "Optimize title", mode: "Optimize", prompt: "Optimize the title, caption, description, CTA, and hashtags." },
    { label: "Review my draft", mode: "Review", prompt: "Review my draft using keep, change, remove, and add." },
  ];
  function chooseDepth(action: { mode: CreatorOutputMode; prompt: string }) {
    setOutputMode(action.mode);
    setBrief(`${defaultBrief}\n\nNeed: ${action.prompt}`);
  }
  async function generate() {
    setLoading(true); setError(false);
    try { const response = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: video.id, brief, outputMode, profile }) }); const payload = await response.json() as { plan?: CreatorActionPlan; ideas?: { title: string; rationale: string }[] }; if (!response.ok || !payload.ideas) throw new Error(); setPlan(payload.plan ?? buildCreatorActionPlan(video, profile)); setIdeas(payload.ideas); setGenerated(true); } catch { setError(true); } finally { setLoading(false); }
  }
  const [copied, setCopied] = useState(false);
  function copyBrief() {
    const text = `MOMENTUM Creator Brief: ${video.title}\n\nTHESIS:\n${plan.thesis}\n\nHOOK:\n${plan.hook}\n\nSCRIPT BEATS:\n${plan.scriptBeats.join("\n")}\n\nREMIX ANGLES:\n${plan.remakeAngles.join("\n")}\n\nHASHTAGS:\n${plan.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }
  return <><PageIntro eyebrow={`Content assistant / ${sourceMode === "live" ? "Live source" : "Sample fixture"}`} title="Turn a trend into something worth making." description="Choose how deep you want to go. MOMENTUM starts with source evidence and channel fit, then generates only the layer you ask for." action={<div style={{ display: "flex", gap: "8px" }}><button className="quiet-button" onClick={copyBrief}>{copied ? "Copied! ✦" : "Copy Brief 📋"}</button><button className="quiet-button" onClick={() => { setGenerated(false); setIdeas([]); setPlan(buildCreatorActionPlan(video, profile)); }}><RefreshCw size={14} /> Reset</button></div>} />
      {preselectedVideoId && <div className="prefilled-banner"><Sparkles size={14} /><span>Pre-filled from video — <strong>{video.title}</strong>. The content plan is ready to generate.</span><Link href={`/trending/${preselectedVideoId}`} className="back-link" style={{ display: "inline" }}>← Back to signal</Link></div>}
    <div className="creator-studio">
      <section className="source-dossier panel-surface">
        <p className="eyebrow">Source evidence</p>
        <a href={video.sourceUrl} target="_blank" rel="noreferrer" className="assistant-source-thumb" style={{ backgroundImage: `url(${displayThumbnail(video)})` }} aria-label="Open source video on YouTube"><span className="deep-play"><Play size={18} fill="currentColor" /></span><span className={`trend-badge trend-${video.label.toLowerCase()}`}>{video.label}</span></a>
        <h2>{video.title}</h2>
        <div className="assistant-evidence-grid">
          <Insight label="Views" value={compact(video.views)} />
          <Insight label="Views / hour" value={compact(video.viewsPerHour)} />
          <Insight label="Format" value={video.videoKind ?? "Shorts"} />
          <Insight label="Confidence" value={video.rankConfidence ?? "Sample"} />
        </div>
        <div className="idea-evidence"><span>{video.category}</span><span>{video.topic}</span><span>{video.format}</span><span>{video.taxonomySource === "ai" ? "AI taxonomy" : "Rule taxonomy"}</span></div>
        <p className="source-boundary">{video.rankReason ?? "This plan uses a single observed snapshot. Treat it as a directional signal until repeated scans confirm the pattern."}</p>
      </section>
      <section className="idea-generator panel-surface">
        <p className="eyebrow">Request</p>
        <h2>What output should MOMENTUM prepare?</h2>
        <div className="opportunity-meter">
          <div><span>Creator opportunity</span><strong>{opportunity.score}/100</strong></div>
          <p>{opportunity.recommendation}</p>
        </div>
        <div className="channel-context">
          <label>Niche<input value={profile.niche} onChange={(event) => setProfile({ ...profile, niche: event.target.value })} /></label>
          <label>Audience<input value={profile.audience} onChange={(event) => setProfile({ ...profile, audience: event.target.value })} /></label>
          <label>Language<select value={profile.language} onChange={(event) => setProfile({ ...profile, language: event.target.value })}><option>Hinglish</option><option>Hindi</option><option>English</option><option>Regional</option></select></label>
          <label>Format<select value={profile.format} onChange={(event) => setProfile({ ...profile, format: event.target.value })}><option>Shorts</option><option>Long</option><option>Both</option></select></label>
          <label className="channel-context-wide">Goal<input value={profile.goal} onChange={(event) => setProfile({ ...profile, goal: event.target.value })} /></label>
        </div>
        <div className="opportunity-breakdown"><span>{opportunity.trendStrength} trend</span><span>{opportunity.channelFit} fit</span><span>{opportunity.timing} timing</span><span>{opportunity.difficulty} difficulty</span></div>
        <div className="make-options">
          <strong>What you could make</strong>
          {opportunity.alternatives.map((item) => <button key={item} type="button" onClick={() => { setOutputMode("Plan"); setBrief(`${defaultBrief}\n\nConcept direction: ${item}`); }}>{item}<ChevronRight size={12} /></button>)}
        </div>
        <div className="assistant-depth-actions" aria-label="Choose assistant depth">
          {depthActions.map((action) => <button key={action.label} type="button" onClick={() => chooseDepth(action)}>{action.label}</button>)}
        </div>
        <div className="assistant-mode-tabs" role="tablist" aria-label="Creator output type">
          {(["Explore", "Plan", "Write", "Optimize", "Review"] as const).map((mode) => <button key={mode} role="tab" aria-selected={outputMode === mode} className={outputMode === mode ? "control-active" : ""} onClick={() => setOutputMode(mode)}>{mode}</button>)}
        </div>
        <p className="assistant-mode-note">{modeIntro(outputMode)}</p>
        <textarea value={brief} onChange={(event) => setBrief(event.target.value)} aria-label="Content idea brief" />
        <div className="generator-row"><button className="primary-button" onClick={generate} disabled={loading}><PenLine size={15} /> {loading ? "Grounding output..." : `Generate ${outputMode.toLowerCase()}`}</button><span>{error ? "The grounded request failed. Try again." : "Generated only after you ask"}</span></div>
        <div className="assistant-promise"><Activity size={14} /><span>Output is grounded in source metrics, category, duration, topic, and the selected request.</span></div>
      </section>
      <section className="generated-ideas creator-output-stage">
        {loading ? <IdeasSkeleton /> : generated ? <><div className="section-heading"><div><p className="eyebrow">Grounded output / {outputMode}</p><h2>Angles, mechanics, packaging, and checks</h2></div><span className="sample-label">{ideas.length ? "Generated from evidence" : "No output"}</span></div>
          <div className="assistant-scorecard panel-surface"><div><span>Make-or-skip read</span><strong>{opportunity.score}/100</strong></div><p>{opportunity.why.join(" ")}</p></div>
          <div className="idea-stack">{ideas.map((idea, index) => <IdeaCard key={idea.title} number={String(index + 1).padStart(2, "0")} title={idea.title} text={idea.rationale} tag="Evidence-backed direction" />)}</div>
          <div className="creator-output-panel panel-surface">
            <PlanBlock title="Niche mechanics" items={plan.nicheMechanics} />
            <PlanBlock title="Script beats" items={plan.scriptBeats} />
            <PlanBlock title="Remix scripts" items={plan.remixScripts} />
            <PlanBlock title="Validation checks" items={plan.validationPlan} />
          </div>
          <div className="creator-packaging-grid">
            <div className="plan-block"><strong>Title frames</strong>{plan.titleFrames.map((item) => <p key={item}>{item}</p>)}</div>
            <div className="plan-block"><strong>Thumbnail direction</strong><p>{plan.thumbnailDirection}</p><strong>Description draft</strong><p>{plan.descriptionDraft}</p></div>
            <div className="plan-block hashtag-block"><strong><Hash size={13} /> Hashtag set</strong><div>{plan.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <PlanBlock title="Posting checklist" items={plan.postingChecklist} />
          </div>
          <div className="creator-direction"><strong>Evidence boundary</strong><p>{plan.riskChecks.join(" ")}</p></div>
        </> : <div className="search-empty idea-empty"><div className="search-empty-icon"><PenLine size={22} /></div><h2>Start from the source signal.</h2><p>Pick a depth, choose a mode, then MOMENTUM will return only that grounded creator layer.</p><button className="primary-button" onClick={generate}>Generate {outputMode.toLowerCase()} <ChevronRight size={14} /></button></div>}
      </section>
    </div></>;
}


export function SavedPage() {
  const savedIds = JSON.parse(useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot)) as string[];
  const storedVideos = readSavedVideos();
  const sampleSaved = sampleVideos.filter((video) => savedIds.includes(video.id));
  const allSavedVideosMap = new Map<string, ShortVideo>();
  sampleSaved.forEach((v) => allSavedVideosMap.set(v.id, v));
  storedVideos.forEach((v) => {
    if (savedIds.includes(v.id)) allSavedVideosMap.set(v.id, v);
  });
  const savedVideos = Array.from(allSavedVideosMap.values());
  const savedIdeas = readSavedIdeas();
  const hasSaved = savedVideos.length > 0 || savedIdeas.length > 0;

  return <>
    <PageIntro eyebrow="Workspace / Your signals" title="Saved" description="Keep the Shorts, categories, and ideas you want to return to." action={<span className="sample-label">Local demo workspace</span>} />
    {hasSaved ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {savedVideos.length > 0 && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Saved Signals</p>
                <h2>Saved Shorts ({savedVideos.length})</h2>
              </div>
            </div>
            <div className="video-grid">
              {savedVideos.map((video, index) => (
                <ShortCard
                  key={video.id}
                  rank={index + 1}
                  video={video}
                  saved
                  onSave={() => toggleSavedVideo(video)}
                />
              ))}
            </div>
          </section>
        )}
        {savedIdeas.length > 0 && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Saved Ideas</p>
                <h2>Saved Creator Concepts ({savedIdeas.length})</h2>
              </div>
            </div>
            <div className="idea-stack">
              {savedIdeas.map((idea, index) => (
                <article key={idea.id} className="idea-card">
                  <span className="idea-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{idea.title}</h3>
                    <p>{idea.meta}</p>
                    <span className="idea-tag">Saved Concept</span>
                  </div>
                  <button
                    className="icon-button save-active"
                    onClick={() => toggleSavedIdea(idea)}
                    aria-label="Remove saved idea"
                    title="Remove saved idea"
                  >
                    <Bookmark size={14} fill="currentColor" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    ) : (
      <div className="empty-state saved-empty">
        <Bookmark size={19} />
        <h2>Nothing saved yet.</h2>
        <p>Save a Short or category when you see a signal worth coming back to.</p>
        <Link href="/trending" className="primary-button">Explore what’s trending <ChevronRight size={14} /></Link>
      </div>
    )}
  </>;
}

export function PricingPage() { return <><PageIntro eyebrow="MOMENTUM / Plans" title="Pay for deeper signal, not more noise." description="Start with India-wide momentum. Upgrade when you need the history, context, and creator fit behind it." /><div className="pricing-grid">{plans.map((plan) => <article key={plan.id} className={`pricing-card ${plan.id === "creator" ? "pricing-featured" : ""}`}>{plan.id === "creator" && <span className="plan-recommended">Most useful for creators</span>}<p className="eyebrow">{plan.name}</p><h2>{plan.price}<small>{plan.id !== "free" && "/ month"}</small></h2><p className="plan-description">{plan.description}</p><button className={plan.id === "creator" ? "primary-button" : "quiet-button"}>{plan.id === "free" ? "Current plan" : "Unlock intelligence"} <ChevronRight size={14} /></button><div className="plan-features">{plan.features.map((feature) => <span key={feature}><Check size={13} /> {feature}</span>)}</div></article>)}</div><p className="pricing-note">Billing is not connected in this demo. Plan boundaries are product architecture, not a claim of paid access.</p></>; }

export function SettingsPage() { const usage = getDailyUsage(); return <><PageIntro eyebrow="Workspace / Preferences" title="Settings" description="Keep the radar focused on the market and formats you care about." /><div className="settings-layout"><div className="settings-nav"><button className="settings-active">Profile</button><button>Appearance</button><button>Region</button><button>Preferences</button><button>Usage</button><button>Plan</button><button>About</button></div><section className="settings-panel panel-surface"><div className="settings-section"><p className="eyebrow">Profile</p><h2>Make the signal yours.</h2><label>Display name<input defaultValue="A creator exploring India" /></label><label>Creator focus<select defaultValue="Just exploring"><option>Just exploring</option><option>Food creator</option><option>Travel creator</option><option>Business</option><option>Brand</option></select></label></div><div className="settings-section"><p className="eyebrow">Radar</p><h2>Where should MOMENTUM look?</h2><div className="setting-row"><div><strong>Market</strong><span>India</span></div><span className="locked-pill"><Check size={12} /> Available</span></div><div className="setting-row"><div><strong>City intelligence</strong><span>Local signals are the next layer.</span></div><button className="locked-pill" onClick={() => alert("City intelligence is coming soon.")}><LockKeyhole size={11} /> Locked</button></div></div><div className="settings-section"><p className="eyebrow">Usage</p><h2>Today’s scan budget</h2><div className="usage-large"><div><strong>{usage.used}</strong><span>of {usage.limit} free trends used</span></div><div className="usage-track"><span style={{ width: `${usage.used / usage.limit * 100}%` }} /></div></div></div></section></div></>; }

function demoInsight(video: ShortVideo): GroundedInsight { return { why: video.why, hook: "Can you do it with only the constraint?", format: video.format, payoff: "A visible final reveal" }; }
function displayThumbnail(video: ShortVideo): string { return video.thumbnail.startsWith("/") ? video.thumbnail : `/api/thumbnail?url=${encodeURIComponent(video.thumbnail)}`; }
function compact(value: number) { return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${Math.round(value / 1000)}K` : value.toString(); }
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function Insight({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Dna({ label, text }: { label: string; text: string }) { return <div className="dna-row"><span className="dna-index">+</span><div><strong>{label}</strong><p>{text}</p></div></div>; }
function IdeaCard({ number, title, text, tag }: { number: string; title: string; text: string; tag: string }) {
  useSyncExternalStore(subscribeToSaved, savedSnapshot, savedServerSnapshot);
  const storedIdeas = readSavedIdeas();
  const ideaId = `idea-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const isSaved = storedIdeas.some((item) => item.id === ideaId);
  function handleToggle() {
    toggleSavedIdea({
      id: ideaId,
      type: "idea",
      title,
      meta: text,
      savedAt: new Date().toISOString(),
    });
  }
  return (
    <article className="idea-card">
      <span className="idea-number">{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="idea-tag">{tag}</span>
      </div>
      <button
        className={`icon-button ${isSaved ? "save-active" : ""}`}
        onClick={handleToggle}
        aria-label={isSaved ? "Remove saved idea" : "Save idea"}
        title={isSaved ? "Remove saved idea" : "Save idea"}
      >
        <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
function PlanBlock({ title, items }: { title: string; items: string[] }) { return <div className="plan-block"><strong>{title}</strong>{items.map((item) => <p key={item}>{item}</p>)}</div>; }
function modeIntro(mode: CreatorOutputMode): string {
  if (mode === "Plan") return "Concept options with why, difficulty, risk, and alternative angle.";
  if (mode === "Write") return "Hook, setup, payoff, CTA, spoken words, and visual direction.";
  if (mode === "Optimize") return "Title, caption, description, pinned comment, CTA, and hashtag roles.";
  if (mode === "Review") return "Critique a draft with keep, change, remove, and add.";
  return "Opportunity, lifecycle, fit, risks, and validation before writing anything.";
}

// ─── Creator Action Hub ───────────────────────────────────────────────────────

function CreatorActionHub({ video, relatedVideos }: { video: ShortVideo; relatedVideos: ShortVideo[] }) {
  const [scriptLength, setScriptLength] = useState<ScriptLength>("30s");
  const [showScript, setShowScript] = useState(false);
  const [showHooks, setShowHooks] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const nicheReport = buildNicheStrategyReport(video, relatedVideos);
  const hookOutput = buildHookEngine(video);
  const hashtags = buildHashtagEngine(video);
  const script = showScript ? buildScriptEngine(video, scriptLength) : null;

  return (
    <div className="creator-hub">
      <p className="eyebrow">Creator Action Hub / Grounded intelligence engine</p>
      <h2>From signal to content — evidence-first</h2>
      <p className="insight-lede">All outputs below are grounded in the observed evidence for this video. Labels indicate direction, not guarantees.</p>

      {/* Opportunity Matrix */}
      <div className="hub-section">
        <button className="hub-toggle" onClick={() => setShowMatrix(!showMatrix)} aria-expanded={showMatrix}>
          <Target size={15} />
          <span>Opportunity Matrix</span>
          <span className="hub-badge">{nicheReport.timingWindow} window · {nicheReport.competitionLevel} competition</span>
          <ChevronRight size={13} className={showMatrix ? "hub-chevron-open" : ""} />
        </button>
        {showMatrix && (
          <div className="hub-content">
            <div className="opportunity-matrix-grid">
              <div className="matrix-header" />
              <div className="matrix-col-header">Low Competition</div>
              <div className="matrix-col-header">High Competition</div>
              {nicheReport.opportunityMatrix.map((row) => (
                <>
                  <div key={row.lifecycle} className="matrix-row-label">{row.lifecycle}</div>
                  <div className={`matrix-cell matrix-${row.lowCompetition.toLowerCase()}`}>{row.lowCompetition}</div>
                  <div className={`matrix-cell matrix-${row.highCompetition.toLowerCase()}`}>{row.highCompetition}</div>
                </>
              ))}
            </div>
            <p className="hub-note">{nicheReport.recommendedNext}</p>
            <div className="creator-plan-grid" style={{ marginTop: "16px" }}>
              <PlanBlock title="Top angles" items={nicheReport.topAngles} />
              <PlanBlock title="Adjacent topics" items={nicheReport.adjacentTopics.map((t) => `${t.topic} — ${t.why} (${t.timing})`)} />
            </div>
          </div>
        )}
      </div>

      {/* Content Gap */}
      <div className="hub-section">
        <div className="hub-static">
          <Zap size={15} />
          <div>
            <strong>Content Gap</strong>
            <p>{nicheReport.contentGap.contentGapStatement}</p>
            <p className="hub-opportunity">{nicheReport.contentGap.opportunity}</p>
          </div>
        </div>
        <div className="creator-plan-grid">
          <PlanBlock title="Missing angles" items={nicheReport.contentGap.missingAngles} />
          <PlanBlock title="Underserved niches" items={nicheReport.contentGap.underservedNiches} />
          <PlanBlock title="Audience demand signals" items={nicheReport.contentGap.audienceDemandSignals} />
        </div>
      </div>

      {/* Hook Engine */}
      <div className="hub-section">
        <button className="hub-toggle" onClick={() => setShowHooks(!showHooks)} aria-expanded={showHooks}>
          <Sparkles size={15} />
          <span>Hook Engine — 5 Formulas</span>
          <span className="hub-badge">Recommended: {hookOutput.recommended.type}</span>
          <ChevronRight size={13} className={showHooks ? "hub-chevron-open" : ""} />
        </button>
        {showHooks && (
          <div className="hub-content">
            <div className="hub-recommended">
              <span className="idea-tag">Recommended Hook</span>
              <strong>{hookOutput.recommended.type}</strong>
              <p>{hookOutput.recommended.openingLine}</p>
              <em>{hookOutput.recommended.why}</em>
            </div>
            <div className="hook-formulas">
              {hookOutput.formulas.filter((f) => f.type !== hookOutput.recommended.type).map((formula) => (
                <div key={formula.type} className="hook-formula-card">
                  <strong>{formula.type}</strong>
                  <p>{formula.openingLine}</p>
                  <em>{formula.why}</em>
                </div>
              ))}
            </div>
            <p className="hub-note">{hookOutput.retentionTip}</p>
          </div>
        )}
      </div>

      {/* Script Engine */}
      <div className="hub-section">
        <button className="hub-toggle" onClick={() => setShowScript(!showScript)} aria-expanded={showScript}>
          <FileText size={15} />
          <span>Script Engine</span>
          <span className="hub-badge">Production-ready beats</span>
          <ChevronRight size={13} className={showScript ? "hub-chevron-open" : ""} />
        </button>
        {showScript && script && (
          <div className="hub-content">
            <div className="script-length-tabs">
              {(["15s", "30s", "60s"] as const).map((len) => (
                <button key={len} className={scriptLength === len ? "control-active" : ""} onClick={() => setScriptLength(len)}>{len}</button>
              ))}
            </div>
            <p className="script-title-suggest"><strong>Title suggestion:</strong> {script.title}</p>
            <div className="script-beats">
              {buildScriptEngine(video, scriptLength).beats.map((beat) => (
                <div key={beat.timestamp} className="script-beat">
                  <div className="beat-header">
                    <span className="beat-time">{beat.timestamp}</span>
                    <span className="beat-label">{beat.label}</span>
                  </div>
                  <p className="beat-direction">{beat.direction}</p>
                  <div className="beat-details">
                    <div><span>Spoken</span><em>{beat.spokenWords}</em></div>
                    <div><span>On screen</span><em>{beat.onScreen}</em></div>
                    {beat.visualNote && <div><span>Visual</span><em>{beat.visualNote}</em></div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="creator-plan-grid" style={{ marginTop: "16px" }}>
              <PlanBlock title="B-roll suggestions" items={script.brollSuggestions} />
              <PlanBlock title="Retention hypothesis" items={script.retentionHypothesis} />
            </div>
            <p className="hub-note">{script.evidenceBoundary}</p>
          </div>
        )}
      </div>

      {/* Hashtag Engine */}
      <div className="hub-section">
        <button className="hub-toggle" onClick={() => setShowHashtags(!showHashtags)} aria-expanded={showHashtags}>
          <Hash size={15} />
          <span>Hashtag Engine</span>
          <span className="hub-badge">{hashtags.stack.length} tags · strategic set</span>
          <ChevronRight size={13} className={showHashtags ? "hub-chevron-open" : ""} />
        </button>
        {showHashtags && (
          <div className="hub-content">
            <div className="hashtag-stack-display">
              {hashtags.stack.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <p className="hub-note">{hashtags.rationale}</p>
          </div>
        )}
      </div>

      {/* CTA to Ideas Studio */}
      <div className="hub-cta">
        <Link href={`/ideas?videoId=${video.id}`} className="primary-button">
          <PenLine size={14} /> Open full AI Ideas Studio <ChevronRight size={14} />
        </Link>
        <p>Takes all evidence above into the full content generation workspace.</p>
      </div>

      <p className="hub-evidence-note">{nicheReport.evidenceBoundary}</p>
    </div>
  );
}
