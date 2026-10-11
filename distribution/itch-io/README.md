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


## Optional: GitHub-only automated uploads after initial setup

itch.io's **free [butler](https://itch.io/docs/butler/pushing.html)** CLI can send an HTML5 build without your computer being powered on. It does NOT create the game page, set it public, or configure browser-playable flags. It needs an itch.io account and one manual project-page creation.

1. Sign in to [itch.io New Game](https://itch.io/game/new), create the `space-clicker-pocket-galaxy` project, initially private.
2. In [itch.io API keys](https://itch.io/user/settings/api-keys), create/get a *butler/wharf* key. **Never paste a key into chat or commit it into code.**
3. In [Space Clicker GitHub repository secrets](https://github.com/garrison2025/SPACE-CLICKER-GAME/settings/secrets/actions), create repository secret named `BUTLER_API_KEY`. Do not enable any scheduled publishing yet.
4. Open [Publish Pocket Galaxy — manual only](https://github.com/garrison2025/SPACE-CLICKER-GAME/actions/workflows/itch-io-publish.yml), choose **Run workflow**, enter the *existing* itch username and slug in the format `username/space-clicker-pocket-galaxy`, and check the explicit **confirm_publish** box.
5. GitHub verifies the game, downloads the official butler CLI and runs `butler push dist/butler username/space-clicker-pocket-galaxy:html5 --if-changed`. There is **no cron** or unattended publishing.
6. In itch.io **Edit game**, set Kind to **HTML Game**, mark the uploaded `html5` channel **HTML5 / Playable in browser**, set mobile settings only after preview tests, and make the game public when satisfied. Metadata may include the original site homepage.

This keeps future builds free and one-click from GitHub, while protecting the initial external publication behind your direct approval. Neither the game page nor any backlink exists until you carry out that one-time publisher action.

Official documentation: [butler authentication](https://itch.io/docs/butler/login.html) · [pushing channels](https://itch.io/docs/butler/pushing.html) · [CI-friendly install](https://itch.io/docs/butler/installing.html).
