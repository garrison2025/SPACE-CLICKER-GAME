# Space Clicker: Pocket Galaxy — itch.io distribution

An **independent playable mini-edition**, not a wrapper around the production website.

## Rebuild for free

[GitHub Actions: Build playable itch.io HTML5 package](https://github.com/garrison2025/SPACE-CLICKER-GAME/actions/workflows/itch-io.yml)

1. Open the workflow above and choose **Run workflow**, branch `main`.
2. Open the completed workflow run and download the **itch-io-pocket-galaxy-game** artifact.
3. Unzip the Actions artifact. Inside is `space-clicker-pocket-galaxy.zip`. **Upload that inner ZIP** to itch.io, without unpacking it first.
4. In itch.io select **Create new project → HTML Game**.
5. Use game title **Space Clicker: Pocket Galaxy** and upload `space-clicker-pocket-galaxy.zip`.
6. Select **Embed in page** or **Click to launch fullscreen**. Recommended first test size: **960 × 720**; preview desktop and mobile. Use `Mobile Friendly` only once touch controls are validated.
7. Add the original website as an accurate **Homepage** link in the game's Metadata / External Links: https://spaceclickergame.com/
8. Set visibility to public after QA. Record the public itch.io listing URL in Backlink OS, and inspect whether the listing's outbound website link is actually rendered as an `<a>`.

## Editorial description (copy and adapt)

**Headline:** Mine Stardust. Build drones. Ascend your galaxy.

**Short description:** Pocket Galaxy is a free, self-contained space clicker game. Tap your planet to gather Stardust, buy Plasma Drills, deploy automated mining drones, and reset a run for permanent Dark Matter upgrades. Progress is saved locally. Works with touch or mouse, with no ads or account required.

**Tags:** idle, incremental, clicker, space, browser, html5, casual, offline, mining

**Important:** This is a standalone mini-edition, not a claim that all experiences from SpaceClickerGame.com are included.

## Technical verification

- One `index.html` at ZIP root, no extra file dependencies
- JavaScript and CSS inline; no CDN, ads, analytics, or external assets loaded
- Offline functionality, localStorage save, mobile-responsive touch controls
- Node smoke tests cover click mining, purchasing upgrades, passive drone production, prestige, and progress reset
- Automated ZIP integrity test in the workflow
- No automation will sign in to itch.io or publish a page without a creator account

## Tracking

[13-Site Backlink OS publication queue](https://github.com/chenmu2024/13-Site-Backlink-OS/blob/main/reports/actionable_queue.md) — opportunity `L027`.

*The game ZIP is generated as a GitHub Actions artifact with 30-day retention; regenerate it at any time using the workflow.*
