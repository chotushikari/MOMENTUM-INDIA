# Data Model

The central objects are:

- `ShortVideo`: normalized source evidence and derived current metrics.
- `Category`: an AI-named or curated grouping with subtopics and momentum.
- `VideoSnapshot`: a point-in-time view count, likes, and comments record.
- `TrendScore`: deterministic label, momentum, velocity, and engagement output.
- `SavedItem`: user workspace intent, currently local in demo mode.
- `Entitlement`: server-capable plan capability key.

Source-specific YouTube responses are never passed directly to UI components.
The adapter maps them to `ShortVideo`, preserving source URLs and marking
`sourceMode` as `live`. Fixture data is marked `demo`.
