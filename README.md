# MOMENTUM

**YouTube Shorts intelligence for India.**

MOMENTUM helps creators see what is gaining momentum before the signal becomes
obvious. It turns Shorts evidence into a clear loop:

```text
India -> What is trending -> Momentum -> Why it moves -> AI category -> Idea
```

## Product

The MVP is deliberately focused:

- YouTube only
- Shorts only
- India-wide intelligence
- city-level intelligence visible as a locked future capability
- demo fixtures and live YouTube data kept explicitly separate

The product experience is a dark, editorial intelligence workspace with a
compact sidebar, evidence-led cards, deterministic momentum, AI category
direction, niche search, deep dives, saved signals, ideas, pricing, and
settings.

## Demo

Run the app in demo mode and explore the complete product story without API
credentials:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo fixtures are labeled throughout the interface. They are product scaffolding,
not current YouTube activity.

## Live mode

Copy `.env.example` to `.env.local`, add a server-side `YOUTUBE_API_KEY`, and
set `DATA_MODE=live`. The `/api/trends` route then retrieves India-wide Shorts,
validates the response, filters videos to 60 seconds or less, derives only
transparent metrics, and returns source URLs. A failed live request returns an
explicit error; it never silently substitutes demo data.

OpenAI is intentionally behind a separate request boundary. It should only be
called for category naming, trend explanation, or content ideas when the user
asks for that interpretation and the source evidence is available.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Premium home radar and executive momentum snapshot |
| `/trending` | Filterable India-wide Shorts feed |
| `/trending/[videoId]` | Evidence, score, why-trending, viral DNA, and ideas |
| `/categories` | AI-built category map |
| `/categories/[slug]` | Category subtopics and representative Shorts |
| `/search` | Niche search and signal results |
| `/ideas` | Focused creator idea generator |
| `/saved` | Local demo saved workspace |
| `/pricing` | Free, Creator, and Pro entitlement presentation |
| `/settings` | Profile, region, preferences, and usage surface |

## API boundaries

- `GET /api/trends`
- `GET /api/trends/[id]`
- `GET /api/categories`
- `GET /api/categories/[slug]`
- `GET /api/search?q=...`
- `GET /api/videos/[id]`
- `GET /api/videos/[id]/insights`
- `POST /api/ideas`
- `GET /api/usage`
- `GET /api/entitlements`

These endpoints are intentionally small and typed around product domain
objects. Provider credentials never reach the browser.

## Architecture

Read the project contracts:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PRODUCT.md](./PRODUCT.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [TREND_ENGINE.md](./TREND_ENGINE.md)
- [ENVIRONMENT.md](./ENVIRONMENT.md)
- [AGENTS.md](./AGENTS.md)

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
git diff --check
```

For browser QA, verify desktop widths at 1440px and 1280px, tablet at 768px,
and mobile at 390px. Check the sidebar, locked cities, filters, saved action,
deep dive tabs, pricing surface, empty search, and provider failure state.

## Deployment

This repository is intended for the existing `momentum` Vercel project. Keep
the framework preset on Next.js and set `DATA_MODE=demo` until a valid
`YOUTUBE_API_KEY` is configured in Vercel environment variables. Never commit
`.env.local` or put provider keys in `NEXT_PUBLIC_*` variables.

## License

Private product codebase. Licensing will be finalized before distribution.
