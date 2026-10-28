# AdSense Reapplication Readiness — 2026-10-09

Purpose: reduce the risk of another **Low value content** rejection while keeping the site useful for players and search engines.

This is an internal quality baseline, not a promise of approval. Google does not publish a guaranteed word-count threshold or a checklist that guarantees site approval.

## October 28, 2026 follow-up

- Retired the duplicate /spacebar-clicker-unblocked/ entry with a 301 to /spacebar-clicker/. Removed its navigation, collection schema and sitemap entries; the same game and local save remain available at the primary URL.
- Replaced the generic psychology and hardware essays with a Galaxy Miner progress checklist and Spacebar CPS troubleshooting guide, retaining their published URLs and updating titles, excerpts and revision dates.
- Added a real fresh-run screenshot, explicit upgrade/payback calculations, the 25-Drone milestone calculation, reset reward examples and reset retention details to the strategy guide.
- Corrected reset descriptions to match the existing formula: 40 billion current Stardust yields 1 Dark Matter; 1 trillion yields 5. Gameplay rules were not changed.
- Replaced repeated flagship editorial prose with failure diagnosis and concrete next steps. Added public source/change-history access and explained the distinction between calculated examples and recorded playthroughs.
- Verification must include the existing build, storage and routing checks, retired-route redirects (including legacy queries), 31 sitemap entries and absence of internal links to the retired entry. Run the existing date-based prerender checks with TZ=UTC, matching CI.

## What changed

- Added original, version-specific editorial guides to all six core game pages.
- Each game now explains:
  - what makes the mode different;
  - the decisions a player actually makes;
  - a practical beginner plan;
  - save/offline behavior and limitations;
  - a visible review date tied to the current browser build.
- The same content is available in runtime React and prerendered HTML.
- Added build-time checks that reject:
  - placeholder / under-construction language on indexable pages;
  - legacy Monetag / Adsterra / popunder markers;
  - game pages missing the editorial value blocks;
  - game pages falling below the project's internal publisher-content depth guardrail.
- Strengthened the About page with visible editorial ownership and review methodology.
- Updated Privacy and Cookie/Local Storage disclosures so AdSense review/serving can be described accurately when enabled.

## Publisher-content strategy

The site should be judged primarily on its original browser games, tools, explanations, guides, and comparisons—not on navigation or legal screens.

### Primary AdSense-eligible content pages

- /
- /game/galaxy_miner/
- /game/mars_colony/
- /game/star_defense/
- /game/merge_ships/
- /game/gravity_idle/
- /game/deep_signal/
- /spacebar-games/
- /spacebar-clicker/
- /spacebar-clicker-2/
- /spacebar-counter/
- /spacebar-clicker-test/
- /spacebar-clicker-unblocked/
- /compare/
- /achievements/
- /blog/
- all ten full blog articles

### Pages to exclude from Auto ads after approval

These pages are important for trust/navigation but should not be treated as primary ad inventory:

- /contact/
- /privacy/
- /terms/
- /cookies/
- /sitemap/
- 404 pages

Configure these as page exclusions in AdSense Auto ads, or avoid loading display ad units on them.

## Reapplication sequence

1. Let the new production build finish deploying.
2. Manually open the homepage, all six game pages, Spacebar hub/tools, About, Contact, Privacy, and several blog articles.
3. Confirm there are no broken sections, blank states, or placeholder text.
4. Add the current AdSense verification/serving code only after the content build is stable.
5. Add/update ads.txt with the current publisher line supplied by the active AdSense account.
6. In AdSense, configure a Google-certified consent solution before personalized ads are served where required (for example EEA/UK/Switzerland).
7. Keep ad density conservative during the first review. Do not place ads beside game controls, primary CTA buttons, navigation, or other interaction targets.
8. Reapply only after the deployed site and policy pages reflect the same current build.

## What not to do before reapplication

- Do not mass-publish thin AI-query pages.
- Do not add scraped game descriptions or copied competitor content.
- Do not add fabricated reviews, player counts, earnings claims, or benchmark statistics.
- Do not reintroduce popup/popunder networks while the AdSense review is pending.
- Do not put Auto ads on navigation-only/legal screens.
- Do not increase ad density to compensate for low traffic.

## Quality guardrail

The repository intentionally uses an internal minimum content-depth check on the six game pages. This is **not a Google word-count requirement**. It is only a regression guard to prevent a future code change from reducing an original game page back to a nearly empty interaction screen.

Approval still depends on Google's review of the whole site, user experience, policy compliance, and the quality/originality of publisher content.
