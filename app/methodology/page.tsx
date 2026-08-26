import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductShell } from "@/components/product-shell";

const sections = [
  {
    title: "What we measure",
    text: "MOMENTUM retrieves public YouTube candidates, enriches them with source details, normalizes duration and statistics, classifies format and taxonomy, then ranks the matched sample.",
    points: ["retrieved candidates", "enriched video details", "matched filters", "shown results"],
  },
  {
    title: "How momentum works",
    text: "Momentum is not popularity. It weighs views per hour, freshness, engagement, reach, and evidence confidence. Raw views alone should not dominate the ranking.",
    points: ["velocity", "freshness", "engagement", "confidence"],
  },
  {
    title: "What coverage means",
    text: "A scan only represents the candidate pool MOMENTUM could retrieve and inspect. The UI should say top signals from candidates analyzed, not the best videos on YouTube.",
    points: ["coverage confidence", "ranking scope", "retrieved at", "source requests"],
  },
  {
    title: "What AI does",
    text: "AI explains source evidence and helps create original concepts. It does not calculate views, rankings, velocity, or guaranteed performance.",
    points: ["grounded interpretation", "creator opportunities", "risk checks", "no invented data"],
  },
];

export default function MethodologyPage() {
  return <ProductShell>
    <div className="page-intro methodology-intro">
      <div>
        <p className="eyebrow">MOMENTUM / SIGNAL METHODOLOGY</p>
        <h1>What we know, what we infer, and what we never pretend.</h1>
        <p>MOMENTUM is useful only if its evidence boundaries are visible. This page explains the product&apos;s discovery, ranking, confidence, and AI grounding model.</p>
      </div>
      <Link href="/trending" className="primary-button">Scan signals <ChevronRight size={14} /></Link>
    </div>
    <section className="methodology-grid">
      {sections.map((section) => <article className="panel-surface methodology-card" key={section.title}>
        <h2>{section.title}</h2>
        <p>{section.text}</p>
        <div>{section.points.map((point) => <span key={point}>{point}</span>)}</div>
      </article>)}
    </section>
    <section className="panel-surface methodology-warning">
      <p className="eyebrow">Coverage language</p>
      <h2>Use honest product claims.</h2>
      <div className="methodology-copy-grid">
        <div><strong>Say</strong><p>Top MOMENTUM signals from the candidates analyzed.</p><p>Based on the latest India discovery sample.</p><p>Momentum ranking within retrieved public signals.</p></div>
        <div><strong>Do not say</strong><p>The best 10 videos on YouTube.</p><p>Everything trending in India.</p><p>YouTube&apos;s official ranking.</p></div>
      </div>
    </section>
  </ProductShell>;
}
