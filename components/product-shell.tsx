"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Bookmark,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Gem,
  Home,
  LockKeyhole,
  Menu,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { cityOptions } from "@/lib/demo-data";
import { getDailyUsage } from "@/lib/entitlements";

type ProductShellProps = { children: ReactNode };

const discoverLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "What’s Trending", icon: TrendingUp },
  { href: "/categories", label: "AI Categories", icon: BrainCircuit },
  { href: "/search", label: "Search Niche", icon: Search },
];

const intelligenceLinks = [
  { href: "/trending/short-01", label: "Trend Deep Dive", icon: BarChart3 },
  { href: "/ideas", label: "AI Ideas", icon: Sparkles },
];

function NavLink({ href, label, icon: Icon, onNavigate }: { href: string; label: string; icon: typeof Home; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} onClick={onNavigate} className={`nav-link ${active ? "nav-link-active" : ""}`}>
      <Icon size={16} strokeWidth={active ? 2.1 : 1.7} />
      <span>{label}</span>
    </Link>
  );
}

export function ProductShell({ children }: ProductShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<"city" | "upgrade" | null>(null);
  const usage = getDailyUsage();
  const usagePercent = `${(usage.used / usage.limit) * 100}%`;

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/" className="brand-lockup" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><Sparkles size={15} /></span>
            <span>MOMENTUM</span>
          </Link>
          <button className="icon-button sidebar-close" aria-label="Close navigation" title="Close navigation" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>

        <div className="sidebar-scroll">
          <div className="nav-group">
            <p className="nav-label">Discover</p>
            {discoverLinks.map((item) => <NavLink key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />)}
          </div>
          <div className="nav-group">
            <p className="nav-label">Intelligence</p>
            {intelligenceLinks.map((item) => <NavLink key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />)}
          </div>
          <div className="nav-group">
            <p className="nav-label">Workspace</p>
            <NavLink href="/saved" label="Saved" icon={Bookmark} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="nav-group">
            <p className="nav-label">Coming soon</p>
            {cityOptions.slice(0, 2).map((city) => (
              <button key={city} className="nav-link nav-link-locked" onClick={() => setModal("city")}>
                <LockKeyhole size={15} /><span>{city} intelligence</span><span className="nav-soon">Soon</span>
              </button>
            ))}
            <button className="nav-link nav-link-locked" onClick={() => setModal("upgrade")}><Clock3 size={15} /><span>Historical explorer</span><span className="nav-soon">Pro</span></button>
            <button className="nav-link nav-link-locked" onClick={() => setModal("upgrade")}><Compass size={15} /><span>Competitor radar</span><span className="nav-soon">Pro</span></button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="usage-card">
            <div className="usage-heading"><span>Free plan</span><span>{usage.used} / {usage.limit} trends</span></div>
            <div className="usage-track"><span style={{ width: usagePercent }} /></div>
            <button className="usage-upgrade" onClick={() => setModal("upgrade")}>Unlock deeper intelligence <ChevronRight size={13} /></button>
          </div>
          <div className="sidebar-foot-links"><Link href="/settings"><Settings size={14} /> Settings</Link><button onClick={() => setModal("upgrade")}><Gem size={14} /> Upgrade</button></div>
        </div>
      </aside>

      {mobileOpen && <button aria-label="Close menu" className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="app-content">
        <header className="topbar">
          <button className="icon-button menu-trigger" aria-label="Open navigation" title="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>India</strong></div>
          <div className="topbar-actions">
            <Link href="/search" className="command-button"><Search size={15} /><span>Search intelligence</span><kbd>⌘ K</kbd></Link>
            <button className="region-button" onClick={() => setModal("city")}><span className="india-dot" /> India <ChevronDown size={14} /></button>
            <Link href="/settings" className="avatar-button" aria-label="Open settings" title="Settings">A</Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      {modal === "city" && <Modal title="Local intelligence is coming" onClose={() => setModal(null)}>
        <p>MOMENTUM currently tracks India-wide Shorts momentum. City-level signals are part of the next intelligence layer.</p>
        <div className="locked-city-list">{cityOptions.map((city) => <div key={city}><span>{city}</span><span className="locked-pill"><LockKeyhole size={11} /> Coming soon</span></div>)}</div>
        <Link href="/pricing" className="primary-button" onClick={() => setModal(null)}>Unlock early access <ChevronRight size={15} /></Link>
      </Modal>}
      {modal === "upgrade" && <Modal title="Go deeper than the snapshot" onClose={() => setModal(null)}>
        <p>Creator intelligence, longer trend history, and opportunity signals turn a moment into a repeatable edge.</p>
        <div className="upgrade-callout"><Gem size={18} /><div><strong>Creator plan</strong><span>Unlimited niche search, AI category explorer, and saved workspace.</span></div></div>
        <Link href="/pricing" className="primary-button" onClick={() => setModal(null)}>Explore plans <ChevronRight size={15} /></Link>
      </Modal>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-wrap" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog" title="Close dialog"><X size={17} /></button>
      <p className="eyebrow">MOMENTUM / ACCESS</p><h2 id="modal-title">{title}</h2><div className="modal-body">{children}</div>
    </section>
  </div>;
}
