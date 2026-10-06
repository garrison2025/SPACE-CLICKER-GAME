import React from 'react';

const SpacebarGamesPage: React.FC = () => {
  const games = [
    {
      href: '/spacebar-clicker/',
      title: 'Spacebar Clicker',
      badge: 'IDLE / INCREMENTAL',
      description: 'Press Space for points, buy manual and automatic upgrades, build combos, earn offline progress and prestige for permanent Quantum Keys.',
      bestFor: 'Longer progression sessions',
      timing: 'Open-ended',
      progression: 'Upgrades + Quantum Keys',
      localData: 'Local save + export/import',
      cta: 'Play Spacebar Clicker'
    },
    {
      href: '/spacebar-clicker-test/',
      title: 'Spacebar Clicker Test',
      badge: 'CPS SPEED TEST',
      description: 'Run 1, 5, 10, 30 or 60 second tests, choose a custom duration, or race to 100 presses as quickly as possible.',
      bestFor: 'Measuring spacebar speed',
      timing: '1–60s, custom 1–300s, or 100 presses',
      progression: 'None',
      localData: 'Mode bests + last 10 runs',
      cta: 'Start Spacebar CPS Test'
    },
    {
      href: '/spacebar-counter/',
      title: 'Spacebar Counter',
      badge: 'ENDLESS COUNTER',
      description: 'Count deliberate Space presses with current CPS, average CPS, peak CPS and a best count saved in this browser.',
      bestFor: 'Untimed counting and practice',
      timing: 'Untimed',
      progression: 'None',
      localData: 'Current + highest total',
      cta: 'Open Spacebar Counter'
    },
    {
      href: '/spacebar-clicker-2/',
      title: 'Spacebar Clicker 2',
      badge: 'OVERDRIVE EDITION',
      description: 'A separate enhanced edition with Overdrive surges, stronger automation, offline earnings and Nova Core ascension.',
      bestFor: 'A deeper second progression loop',
      timing: 'Open-ended',
      progression: 'Upgrades + Nova Cores',
      localData: 'Local save + export/import',
      cta: 'Play Spacebar Clicker 2'
    },
    {
      href: '/spacebar-clicker-unblocked/',
      title: 'Spacebar Clicker Instant Play',
      badge: 'NO DOWNLOAD',
      description: 'Open the full Spacebar Clicker game directly in a modern browser with keyboard and mobile controls and local browser saves.',
      bestFor: 'Quick browser access',
      timing: 'Open-ended',
      progression: 'Same classic progression',
      localData: 'Classic local save',
      cta: 'Open Instant Browser Mode'
    }
  ];

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10 text-center">
        <div className="text-xs font-mono tracking-[0.3em] text-neon-blue mb-3">SPACEBAR ARCADE</div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-5">Spacebar Games</h1>
        <p className="max-w-3xl mx-auto text-gray-400 leading-relaxed">
          Choose from free <strong className="text-gray-200">spacebar clicker games</strong>, an endless space bar counter,
          timed CPS tests and the full incremental clicker. Every mode runs in the browser with no account required.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid md:grid-cols-2 gap-5">
          {games.map((game) => (
            <a
              key={game.href}
              href={game.href}
              className="group rounded-2xl border border-white/10 bg-space-900/80 p-6 md:p-7 hover:border-neon-blue/50 hover:-translate-y-1 transition-all"
            >
              <div className="text-[10px] font-mono tracking-[0.2em] text-neon-blue mb-3">{game.badge}</div>
              <h2 className="text-2xl font-display font-bold text-white group-hover:text-neon-blue transition-colors">
                {game.title}
              </h2>
              <p className="mt-3 text-gray-400 leading-relaxed">{game.description}</p>
              <div className="mt-5 text-xs text-gray-500">
                Best for: <span className="text-gray-300">{game.bestFor}</span>
              </div>
              <div className="mt-5 text-sm font-bold text-neon-blue">{game.cta} →</div>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-space-900/60">
          <table className="w-full min-w-[820px] text-sm text-left">
            <caption className="sr-only">Comparison of Spacebar games, counters, and CPS tests</caption>
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Best for</th>
                <th className="px-5 py-4">Timing</th>
                <th className="px-5 py-4">Progression</th>
                <th className="px-5 py-4">Local data</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={`compare-${game.href}`} className="border-b border-white/5 last:border-b-0 align-top">
                  <td className="px-5 py-4">
                    <a href={game.href} className="font-bold text-white hover:text-neon-blue">{game.title}</a>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{game.bestFor}</td>
                  <td className="px-5 py-4 text-gray-400">{game.timing}</td>
                  <td className="px-5 py-4 text-gray-400">{game.progression}</td>
                  <td className="px-5 py-4 text-gray-400">{game.localData}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-6 md:p-9 space-y-9 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Which spacebar game should you play?</h2>
            <p>
              Use <a href="/spacebar-clicker/" className="text-neon-blue hover:text-white">Spacebar Clicker</a> when you want an incremental game with upgrades, automation, offline progress and prestige. Use the <a href="/spacebar-counter/" className="text-neon-blue hover:text-white">Spacebar Counter</a> when you only want an untimed tally. Use the <a href="/spacebar-clicker-test/" className="text-neon-blue hover:text-white">Spacebar Clicker Test</a> when the goal is a measurable CPS result over a fixed duration. <a href="/spacebar-clicker-2/" className="text-neon-blue hover:text-white">Spacebar Clicker 2</a> is a separate progression game, while the <a href="/spacebar-clicker-unblocked/" className="text-neon-blue hover:text-white">instant browser route</a> opens the classic game without an installation step and does not bypass network restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Spacebar clicker games vs CPS tests</h2>
            <p>
              A spacebar clicker game turns presses into an economy: points buy upgrades and automatic production eventually matters
              more than raw speed. A space bar click test is different because the score is judged by presses per second. Keeping
              those intents on separate pages makes each mode easier to understand and gives each result a clear purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Desktop and mobile support</h2>
            <p>
              Physical Space-key input is available on desktop keyboards. The game and counter pages also provide large touch targets
              for phones and tablets. Timed results ignore the browser's repeated keydown events from simply holding the Space key.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Related Spacebar guides</h2>
            <p>
              Read <a href="/blog/mastering-the-space-bar-clicking-game/" className="text-neon-blue hover:text-white">Mastering the Space Bar</a> for the transition from manual input to automation, or <a href="/blog/mechanics-of-space-bar-clicking-game-physics/" className="text-neon-blue hover:text-white">Space Bar Clicking Game Mechanics</a> for CPS and deliberate key input.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Frequently asked questions</h2>
            <div className="space-y-5">
              <div>
                <h3 className="text-lg text-white">Are these spacebar games free?</h3>
                <p>Yes. The current Spacebar games and tools can be used in a modern browser without a paid account or download.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Which page measures spacebar CPS?</h3>
                <p>Use Spacebar Clicker Test for timed CPS challenges, peak CPS, average CPS, custom durations and the 100-click sprint.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Which page only counts presses?</h3>
                <p>Use Spacebar Counter for an endless press total without a fixed timer or upgrade economy.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Do Spacebar Clicker saves sync between devices?</h3>
                <p>No automatic cloud sync is provided. Supported clicker modes store progress locally, but Spacebar Clicker and Spacebar Clicker 2 can export a save code or backup file for manual transfer and restore.</p>
              </div>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
};

export default SpacebarGamesPage;
