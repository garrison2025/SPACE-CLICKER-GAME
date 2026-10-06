# SEO / GEO Production Baseline

Reference standard: `chenmu2024/Website-Starter-Standard` → `SEO-GEO-QUALITY-GATE.md`.

Accepted baseline date: 2026-10-07  
Canonical origin: https://spaceclickergame.com/

Latest L2 production release audit: [SEO-GEO-L2-AUDIT-2026-10-07.md](./SEO-GEO-L2-AUDIT-2026-10-07.md) — deterministic production SEO/GEO gates passed; field CWV remains an L3 measurement when reliable data is available.

## Scope and evidence

- This baseline records deterministic repository and build rules. It does not invent Search Console, traffic, Volume, KD, CPC, backlink, or AI-visibility metrics.
- The site is currently English-only. No `hreflang` or `x-default` tags should be emitted until real localized, canonical, indexable equivalents exist.
- `llms.txt` is generated as optional interoperability metadata. It is not treated as a Google ranking requirement.
- Primary game/tool behavior documented on the site is checked against the current implementation. External changing claims require an appropriate first-party source when materially relevant.

## Canonical intent ownership

Core route intent ownership lives in `content/routeSeo.js`. One primary intent must have one canonical owner.

| Canonical route | Primary intent | Page type |
| --- | --- | --- |
| `/` | space clicker | homepage / game hub |
| `/game/galaxy_miner/` | galaxy miner | game |
| `/game/mars_colony/` | mars colony idle | game |
| `/game/star_defense/` | star defense clicker | game |
| `/game/merge_ships/` | merge spaceships game | game |
| `/game/gravity_idle/` | gravity idle | game |
| `/game/deep_signal/` | deep space signal game | game |
| `/spacebar-games/` | spacebar games | hub / comparison |
| `/spacebar-clicker/` | spacebar clicker | game |
| `/spacebar-clicker-2/` | spacebar clicker 2 | game |
| `/spacebar-counter/` | spacebar counter | utility |
| `/spacebar-clicker-test/` | spacebar clicker test | utility |
| `/spacebar-clicker-unblocked/` | spacebar clicker unblocked | instant-access route |
| `/compare/` | space clicker comparison | comparison |
| `/achievements/` | galaxy miner milestones | progress utility |
| `/blog/` | space clicker blog | content hub |
| `/about/` | about space clicker game | trust |
| `/contact/` | contact space clicker game | support |
| `/privacy/` | space clicker privacy policy | legal |
| `/terms/` | space clicker terms of service | legal |
| `/cookies/` | space clicker local storage | privacy / storage |
| `/sitemap/` | space clicker sitemap | navigation |

Blog articles keep their own intent-specific canonical URLs and must not be duplicated as AI-query variants.

## GEO / answer-engine baseline

Important pages should expose useful, self-contained passages in initial HTML where practical.

Current required examples:

- Homepage: direct definition of Space Clicker and the Galaxy Miner loop near the start.
- Spacebar Games: extractable comparison table for mode, best use, timing, progression, and local data behavior.
- Spacebar Clicker Test: explicit formulas and limitations:
  - Average CPS = valid presses ÷ active elapsed seconds.
  - Average interval (ms) = 1000 ÷ average CPS.
  - Peak CPS = highest valid-press count in a rolling one-second window.
  - Browser-generated repeat events from holding Space are ignored.
- About: editorial/testing principles and freshness context.
- Strategy guide: bottleneck strategy, idle strategy, and mobile-play sections.

## Technical baseline

The production build must keep:

- One unique title and meta description per prerendered route.
- One H1 per important prerendered route.
- Self-referencing canonical URL using the trailing-slash production form.
- One index/follow robots directive for indexable pages.
- No `meta keywords`.
- No premature monolingual `hreflang` / `x-default`.
- Canonical indexable routes only in `sitemap.xml`.
- Real noindex 404 output.
- Crawlable HTML links between hubs, games, utilities, guides, trust pages, and related next actions.
- Truthful structured data only for visible content.
- 1200×630 social image metadata and route-specific Spacebar social assets.
- RSS and optional `llms.txt` generated from the same build.

## Audit levels

### L1

Run `npm run verify` after SEO-sensitive changes. This covers build/type checks, prerendered metadata, canonicals, robots, route coverage, internal links, schema presence, social metadata, storage tests, middleware tests, and the repository's deterministic SEO/GEO assertions.

### L2

Before a major release, additionally review responsive/mobile behavior, visual hierarchy, core tool flows, lab performance, structured-data eligibility, media relevance, and production URLs.

### L3

Only when real production data is available, review Search Console queries/indexation, landing-page performance, CrUX field data where available, real cannibalization signals, backlinks/mentions from reliable sources, and measurable AI-search visibility.

## Drift rule

A future change should be treated as a regression until justified if it:

- gives two core routes the same primary intent;
- removes a canonical, H1, crawlable critical link, or required raw-HTML answer block;
- adds `x-default` without a real fallback/localized architecture;
- creates a near-duplicate query-variant page without standalone user value;
- reintroduces unsupported statistics, testimonials, rankings, or universal CPS thresholds;
- changes core mechanics claims without matching the implementation.
