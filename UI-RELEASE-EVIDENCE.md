# PR #10 — UI verification record

Date: 2026-10-29. Tested implementation: b65dbc5.
Preview: https://d4585aa4.space-clicker-game.pages.dev/space-clicker-games/
Design scope: DESIGN.md. Production is not published.

| Area | Result | Evidence |
|---|---|---|
| Desktop collection rendering | PASS | Browser screenshot: outputs/games-collection-preview.png in the task workspace; three labeled cards and on-site links observed. |
| Collection → Mass page → Play | PASS | Browser followed the Mass card and loaded the local sandboxed player. |
| Clicks and purchase | PASS | Browser generated 10 mass, bought the first planet; displayed balance became 0, planet total 1, next price 15, production 1/s. |
| Insufficient funds and formula examples | PASS | VM execution of vendored code: unaffordable purchase changed nothing; first two purchases and passive income matched guide. |
| Unload | PASS | After Unload, `iframe[title="Mass solar-system clicker"]` count was 0. AdSense-created frames were not counted as game frames. |
| Phone buttons | PASS | At nominal width 390, Generate Mass click changed the in-frame value from 0 to 1; controls and game area were visually inspected. |
| Responsive collection | PASS | Nominal widths 360/390/768/1024/1440 inspected. Measured document width equalled scroll width; e.g. 352/352, 760/760, 1016/1016 and 1432/1432 (scrollbar reduces viewport content width). |
| Keyboard activation inside frame | PASS | After focusing Generate Mass with one click (mass=1), a native Return keypress raised the visible mass to 2. An earlier frame-locator press timed out; the native-input check confirmed operation. |
| Focus semantics | PASS (source inspection) | Native links/buttons, named frame, scoped visible focus outlines and semantic headings. Full assistive-technology audit NOT RUN. |
| Console errors | PASS for sampled player flow | No errors captured after player loaded on preview. Third-party ad requests/telemetry are not audited by this check. |
| Production user flow | NOT RUN | No authorization to publish this change yet. |
| Lighthouse / field LCP/INP/CLS | NOT RUN | Bundle budgets passed; no runtime speed score inferred. |
| Localization expansion | NOT APPLICABLE | Existing English site; no new locales. |
| Impeccable CLI / extensions | NOT RUN | Review process applied; no optional binary, extension or hook installed. |

The existing site was not redesigned. No claim of full accessibility certification, field performance improvement or increased search traffic is made.

