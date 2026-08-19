# Trend Engine

The engine is intentionally deterministic before AI enters the system.

`lib/intelligence/scoring.ts` provides:

- engagement rate: `(likes + comments) / views`
- velocity: change in views between repeated snapshots
- score label thresholds: Exploding, Rising, Emerging, Steady
- bounded momentum score from velocity and engagement

A single live retrieval has no historical velocity. The live adapter therefore
does not claim growth from missing snapshots. Historical intelligence is a
future persistence milestone and must be based on repeated observations.
