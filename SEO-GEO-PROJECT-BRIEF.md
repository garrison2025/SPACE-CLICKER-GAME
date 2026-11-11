# Collection expansion — SEO implementation brief

Scope and approval: see BUILD-INTAKE-CONTRACT.md. This brief covers only PR #10.

| Intent | Canonical path | Indexation |
|---|---|---|
| Choose on-site playable space games | /space-clicker-games/ | index, self canonical |
| Play the hosted Mass edition and read its controls/limits | /play/mass/ | index, self canonical |
| Raw embedded game and supporting files | /community-assets/mass/* | X-Robots-Tag: noindex; player HTML also has noindex meta |

All 21 incumbent metadata records are preserved byte-for-byte in meaning and values. The homepage, comparison page and existing game guides are not rewritten. The collection and play page have distinct purposes, not keyword variants of existing pages. New routes use the existing trailing-slash handling, 404 logic, metadata system and sitemap generator; the sitemap now has 33 entries.

No new language, country targeting or hreflang is introduced. Existing organization identity and branding are reused; the independently developed game is clearly attributed. No fabricated reviews, player counts, benchmark results, rankings or demand statistics are included. New routes do not invent review/rating schema.

Evidence source: https://github.com/Abhrankan-Chakrabarti/mass ; pinned revision and local adaptations are recorded in public/community-assets/mass/NOTICE.txt, with the exact license text in LICENSE.txt. Mechanics examples were checked against the vendored code and in a VM simulation. Recheck documentation when the upstream build or local rules change.

Discovery: existing More menu links to the new collection, and its cards link to on-site play pages. Adding links to existing article bodies or rewriting the homepage is outside the owner's scope. Raw game files do not become separate indexable inventory. Prerendered content is meaningful before JavaScript; gameplay itself is browser-local JavaScript.

Search traffic, impressions, indexing, rankings, field Core Web Vitals and AdSense acceptance remain UNVERIFIED. No automation or paid search-data service is configured.
