# MOMENTUM-INDIA Engineering Contract

## Product

MOMENTUM is YouTube Shorts intelligence for India. The product turns public
source data into a momentum signal, a reason, and a creator action:

```text
Raw Shorts -> normalized evidence -> momentum -> trend -> explanation -> idea
```

The MVP is India-wide and YouTube Shorts-only. City intelligence is a visible,
clickable premium lock, never a source of fabricated local trend data.

## Design

Build a serious, dark editorial intelligence product inspired by YoTrends,
Linear, Notion, Apple, and Claude without copying their visual identities.

- Use restrained charcoal surfaces, thin borders, dense but breathable spacing,
  strong typography, and one deliberate lime accent.
- Prefer compact controls, evidence-led cards, clear states, and progressive
  disclosure over decorative dashboards.
- Use real source attribution and clearly label demo fixtures.
- Locked capabilities should explain their value and open a considered upgrade
  surface; never use fake metrics or fake local data.
- Responsive layouts must support 1440px, 1280px, 1024px, 768px, and 390px.
- Every interactive control needs keyboard access, visible focus, semantic HTML,
  and reduced-motion support.

## Architecture

- Next.js App Router, strict TypeScript, Tailwind CSS, and lucide-react.
- Keep domain types in `lib/` and the UI consuming typed objects rather than
  static shapes embedded throughout components.
- Keep demo fixtures and future live ingestion behind explicit data boundaries.
- Server-side provider keys only. YouTube and OpenAI integrations must be
  defensive, timeout-aware, and honest about failure.
- Keep entitlements and usage checks in shared server-capable modules. Frontend
  locks are presentation, not authorization.
- Avoid unnecessary infrastructure, broad `any`, giant components, and feature
  work that does not strengthen the core flow.

## Scope

Build the winning product flow first:

```text
India -> What's trending -> momentum -> why it moves -> category -> niche -> idea
```

Routes should support Home, Trending, Categories, Search, Deep Dive, Ideas,
Saved, Pricing, and Settings. Future capabilities include city intelligence,
historical explorer, creator intelligence, competitor radar, and exports.

Do not add browser extensions, autonomous posting, multi-agent orchestration,
vector databases, X/Twitter, or unimplemented social integrations.

## Trust

- Never fabricate source data, metrics, categories, city signals, or AI claims.
- Demo content must be labeled `Sample fixture` or `Demo mode`.
- Momentum scores are deterministic estimates from supplied snapshots. Do not
  describe a single observation as historical growth.
- AI interpretation must receive source evidence and remain visibly distinct
  from observed fields.

## Workflow

Inspect before editing. Make a concise plan for substantial work. Run lint,
typecheck, tests, production build, and browser QA before declaring a milestone
complete. Do not commit or push unless explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
