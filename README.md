# Space Clicker Game

Browser-based clicker and idle game hub for **SpaceClickerGame.com**.

## Included experiences

- Galaxy Miner — space clicker / idle mining game with upgrades, offline progress and Dark Matter prestige
- Mars Colony Idle
- Star Defense
- Merge Spaceships
- Gravity Idle
- Deep Space Signal
- Spacebar Clicker — incremental keyboard game with CPS, upgrades, automation, portable backups and Quantum Key prestige
- Spacebar Clicker 2 — separate progression with Overdrive, automation, Nova Core ascension and portable backups
- Spacebar Counter
- Spacebar Clicker Test
- Spacebar Clicker Unblocked

## Local development

Prerequisite: Node.js 22 or newer (the verification workflow uses Node 22).

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The project does **not** require a Gemini API key or another paid API. Dynamic space events are generated locally in the browser.

## Deployment

The site is designed for Cloudflare Pages. The production domain is:

- https://spaceclickergame.com

Keep canonical URLs, sitemap URLs and internal links on the production domain. Deep routes are handled as SPA routes and important SEO routes are also generated as static entry HTML during the build.
