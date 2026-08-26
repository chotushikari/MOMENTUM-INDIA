import React from "react";

export function ShortCardSkeleton() {
  return (
    <article className="skeleton-card" aria-hidden="true">
      <div className="skeleton-box skeleton-thumb" />
      <div className="skeleton-content">
        <div className="skeleton-box skeleton-line title" />
        <div className="skeleton-box skeleton-line subtitle" />
        <div className="skeleton-box skeleton-line short" />
        <div className="skeleton-box skeleton-line pills" />
      </div>
    </article>
  );
}

export function ShortCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="video-grid video-grid-wide reference-video-grid" aria-label="Loading content..." role="status">
      {Array.from({ length: count }).map((_, index) => (
        <ShortCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShortListRowSkeleton() {
  return (
    <article className="skeleton-list-row" aria-hidden="true">
      <div className="skeleton-box skeleton-list-thumb" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="skeleton-box skeleton-line title" />
        <div className="skeleton-box skeleton-line short" />
      </div>
    </article>
  );
}

export function ShortListViewSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="video-list-view" aria-label="Loading content list..." role="status">
      {Array.from({ length: count }).map((_, index) => (
        <ShortListRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function SearchReportSkeleton() {
  return (
    <div aria-label="Loading search radar..." role="status">
      <section className="skeleton-report-panel">
        <div className="skeleton-box skeleton-line subtitle" />
        <div className="skeleton-box skeleton-line title" style={{ height: "26px", width: "40%" }} />
        <div className="skeleton-box skeleton-line short" style={{ width: "70%" }} />
      </section>
      <ShortCardGridSkeleton count={4} />
    </div>
  );
}

export function DeepDiveSkeleton() {
  return (
    <div aria-label="Loading video deep dive intelligence..." role="status" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <section className="skeleton-report-panel" style={{ minHeight: "220px" }}>
        <div className="skeleton-box skeleton-line title" style={{ height: "32px", width: "75%" }} />
        <div className="skeleton-box skeleton-line subtitle" style={{ width: "50%" }} />
        <div className="skeleton-box skeleton-line short" style={{ width: "30%" }} />
      </section>
      <section className="deep-metric-strip panel-surface">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="skeleton-box skeleton-line short" />
            <div className="skeleton-box skeleton-line title" style={{ width: "60%" }} />
          </div>
        ))}
      </section>
    </div>
  );
}

export function IdeasSkeleton() {
  return (
    <div className="creator-output-stage" aria-label="Generating creator output..." role="status">
      <section className="skeleton-report-panel">
        <div className="skeleton-box skeleton-line subtitle" />
        <div className="skeleton-box skeleton-line title" style={{ height: "24px", width: "60%" }} />
        <div className="skeleton-box skeleton-line short" style={{ width: "90%" }} />
      </section>
      <div className="idea-stack">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="idea-card" style={{ padding: "16px" }}>
            <div className="skeleton-box skeleton-line title" style={{ width: "70%" }} />
            <div className="skeleton-box skeleton-line subtitle" style={{ width: "95%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
