# Architecture

MOMENTUM is a Next.js App Router application with a thin product shell and
typed domain modules. The first implementation keeps infrastructure small while
leaving clean boundaries for production providers.

```text
UI routes
  -> typed product objects
  -> server API boundaries
  -> demo repository OR YouTube adapter
  -> normalized ShortVideo / Category objects
  -> deterministic signal calculations
  -> optional grounded AI interpretation
```

`components/` owns the experience. `lib/demo-data.ts` is the explicit fixture
path. `lib/youtube.ts` is the server-only live adapter. `lib/intelligence/`
contains provider-independent scoring. `lib/entitlements.ts` centralizes plan
capabilities. API route handlers are deliberately narrow.

The current demo saved workspace uses browser-local state. PostgreSQL,
authentication, durable usage enforcement, and billing can be added behind the
same domain contracts without making the presentation depend on a provider.
