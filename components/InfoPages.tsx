
import React from 'react';
import { GAMES_CATALOG } from '../constants';
import { BLOG_POST_META } from '../content/blogMeta';

const PageContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="w-full min-h-screen bg-space-950 text-gray-300 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto bg-space-900/80 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden">
            {/* Decorative Header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-purple-500 to-neon-blue opacity-50"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-8 tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {title}
            </h1>
            
            <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-neon-blue prose-strong:text-white">
                {children}
            </div>
        </div>
    </div>
);

export const AboutPage = () => (
    <PageContainer title="ABOUT SPACE CLICKER GAME">
        <p className="lead text-xl text-gray-200">
            Welcome to <strong>SpaceClickerGame.com</strong>, a browser-based collection of clicker, idle, strategy, and Spacebar experiences.
        </p>
        
        <h3>Our Mission</h3>
        <p>
            SpaceClickerGame.com is built around a simple goal: make browser-based <strong>space clicker games</strong>, idle simulations, and spacebar tools that are fast to start and clear about how they work. No account is required to begin playing.
        </p>
        <p>
            You can mine Stardust in <em>Galaxy Miner</em>, build a colony on Mars, defend a sector, merge ships, experiment with gravity, decode signals, or use the Spacebar Clicker tools. Each experience runs in the browser, and supported games store progress locally on the current device.
        </p>

        <h3>The Technology</h3>
        <p>
            The site uses React 18, Vite, Tailwind CSS, and lightweight browser graphics. The priority is responsive interaction, readable interfaces, and fast loading rather than requiring a game client or paid API.
        </p>

        <h3>Editorial and Testing Principles</h3>
        <p>
            Guides and mechanics articles are written against the current browser implementation wherever the article describes this site&apos;s own games or tools. We avoid presenting unsupported averages, hardware claims, or universal performance thresholds as facts. When a result depends on the player&apos;s device, browser, input rules, or test duration, the article should say so directly.
        </p>
        <p>
            Product behavior such as upgrade costs, prestige thresholds, local save rules, CPS counting, offline progress, and milestone requirements is checked against the current code before publication or revision. External factual references are linked when they materially support a claim.
        </p>

        <div className="bg-space-800 p-6 rounded-lg border-l-4 border-neon-blue my-8">
            <h4 className="m-0 mb-2 text-neon-blue">System Status</h4>
            <ul className="list-none p-0 m-0 text-sm font-mono">
                <li>Policy / site review: October 6, 2026</li>
                <li>Game simulations in the main catalog: 6</li>
                <li>Required paid API for gameplay: None</li>
            </ul>
        </div>
    </PageContainer>
);

export const ContactPage = () => (
    <PageContainer title="SUBSPACE COMMUNIQUÉ">
        <p>
            Have you encountered a bug in the simulation? Do you have a suggestion for a new starship class? Or perhaps you wish to discuss a business partnership? Our communication channels are open.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <div className="bg-space-800 p-6 rounded-xl border border-white/5">
                <h3 className="mt-0">General Inquiries</h3>
                <p>For player support, feedback, and general questions:</p>
                <a href="mailto:info@spaceclickergame.com" className="text-xl font-bold font-mono hover:text-white transition-colors">
                    info@spaceclickergame.com
                </a>
            </div>
            <div className="bg-space-800 p-6 rounded-xl border border-white/5">
                <h3 className="mt-0">Business & Press</h3>
                <p>For advertising, sponsorship, or press kits:</p>
                <a href="mailto:info@spaceclickergame.com" className="text-xl font-bold font-mono hover:text-white transition-colors">
                    info@spaceclickergame.com
                </a>
            </div>
        </div>

        <h3>Transmission Protocols</h3>
        <p>
            When contacting support about a save issue, include the game name, browser, device type, and a brief description of what happened. Do not send passwords or other sensitive account credentials.
        </p>
    </PageContainer>
);

export const PrivacyPage = () => (
    <PageContainer title="DATA PRIVACY PROTOCOLS">
        <p className="text-sm font-mono text-gray-500">Effective Date: October 5, 2026</p>
        
        <p>
            At <strong>SpaceClickerGame.com</strong>, we take your privacy as seriously as we take our shield integrity. This Privacy Policy explains how we collect, use, and protect your information when you access our <strong>space clicker games</strong>.
        </p>

        <h3>1. Information Collection</h3>
        <p>
            <strong>Local Game Data:</strong> Space Clicker Game is primarily a client-side experience. Your game progress (resources mined, buildings constructed, upgrades unlocked) is stored locally on your device using browser LocalStorage. This data does not leave your device unless you explicitly export a save string.
        </p>
        <p>
            <strong>Analytics and advertising:</strong> The current site build does not include Google Analytics, Google Tag Manager, or Google AdSense code. Normal web requests may still expose standard connection information such as IP address and browser headers to the hosting provider and to third-party asset hosts used by a page.
        </p>
        <p>
            <strong>External assets:</strong> Current pages may request font files from Google Fonts and editorial or social-preview images from Unsplash. Those requests are made directly by the browser to the relevant provider and can include standard network information such as IP address, user agent, and request headers.
        </p>

        <h3>2. Use of Information</h3>
        <p>
            Local game data is used by the browser to restore progress, calculate offline earnings where supported, and display local statistics. The current build does not send upgrade histories or save-state contents to a site analytics database.
        </p>
        <ul>
            <li>Game progress is stored in browser localStorage for supported modes.</li>
            <li>Manual export codes are generated only when you choose to view or copy them.</li>
            <li>Clearing site storage can permanently remove local progress unless you kept an exported backup.</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>
            The production site is served over HTTPS. Local save data remains subject to the security and storage behavior of your browser and device; an exported Base64 save code is portable text and is not encrypted.
        </p>

        <h3>4. Contact Us</h3>
        <p>
            If you have questions about these protocols, please contact Command at <a href="mailto:info@spaceclickergame.com">info@spaceclickergame.com</a>.
        </p>
    </PageContainer>
);

export const TermsPage = () => (
    <PageContainer title="TERMS OF SERVICE">
        <p className="text-sm font-mono text-gray-500">Last Updated: October 5, 2026</p>

        <h3>1. Acceptance of Terms</h3>
        <p>
            By accessing <strong>SpaceClickerGame.com</strong> ("the Site"), you agree to abide by these Terms of Service. If you do not agree to these terms, please disconnect from the simulation immediately.
        </p>

        <h3>2. Use License</h3>
        <p>
            Permission is granted to temporarily access the materials (games and software) on Space Clicker Game for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title. You may not:
        </p>
        <ul>
            <li>Modify or copy the game assets for commercial distribution.</li>
            <li>Attempt to reverse engineer any software contained on the Site.</li>
            <li>Use the Site for any malicious mining scripts or botnets that degrade service for others.</li>
        </ul>

        <h3>3. Disclaimer</h3>
        <p>
            The materials on Space Clicker Game are provided on an 'as is' basis. We make no warranties, expressed or implied, regarding the stability of your galactic empire. We are not responsible for save data loss due to browser cache clearing or supernova events.
        </p>

        <h3>4. Limitations</h3>
        <p>
            In no event shall Space Clicker Game or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on the Site.
        </p>

        <h3>5. Governing Law</h3>
        <p>
            These terms do not designate a fictional or universal jurisdiction. Applicable law and any non-waivable consumer rights depend on the circumstances and the jurisdiction that legally applies to the site operator and user.
        </p>
    </PageContainer>
);

export const CookiesPage = () => (
    <PageContainer title="COOKIE & STORAGE SETTINGS">
        <p>
            Browsers provide several storage technologies. <strong>SpaceClickerGame.com</strong> primarily uses localStorage for game progress and settings; localStorage is different from an HTTP cookie.
        </p>

        <h3>1. Essential Local Storage</h3>
        <p>
            We use the browser's <code>localStorage</code> API to save your game state. This is critical for the functionality of our <strong>idle game</strong> mechanics. Without this, your empire would vanish every time you closed the tab.
        </p>
        <p>Examples of functional local storage include:</p>
        <ul>
            <li>Galaxy Miner progress, upgrades, settings, and save timestamps.</li>
            <li>Separate Spacebar Clicker and Spacebar Clicker 2 progression saves.</li>
            <li>Spacebar Counter and CPS Test local-best records.</li>
            <li>Individual simulation saves for Mars Colony, Star Defense, Merge Spaceships, Gravity Idle, and Deep Space Signal.</li>
        </ul>
        <p><em>Internal storage key names are implementation details and may change as save formats are migrated.</em></p>

        <h3>2. Analytics and Advertising</h3>
        <p>
            The current build does not include Google Analytics, Google Tag Manager, or Google AdSense scripts. If those services are introduced later, this notice should be updated to describe the relevant cookies or identifiers before they are enabled.
        </p>

        <h3>3. Managing Your Preferences</h3>
        <p>
            You can choose to disable cookies through your individual browser options. However, clearing your browser's "Site Data" or "Local Storage" <strong>WILL DELETE YOUR GAME PROGRESS PERMANENTLY</strong> unless you have manually exported a save string.
        </p>
        
        <div className="mt-8 p-4 border border-red-500/50 bg-red-900/10 rounded">
            <h4 className="text-red-400 mt-0">Danger Zone</h4>
            <p className="text-sm mb-4">If you wish to reset your consent or clear all local game data, you can do so here. This cannot be undone.</p>
            <button 
                onClick={() => {
                    if(window.confirm("WARNING: This will wipe all game progress across all Space Clicker Game games. Are you sure?")) {
                        localStorage.clear();
                        window.location.reload();
                    }
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                PURGE ALL LOCAL DATA
            </button>
        </div>
    </PageContainer>
);

export const SitemapPage = () => (
    <PageContainer title="SITEMAP">
        <p>Browse every main game, Spacebar tool, guide, and site resource from one crawlable directory.</p>

        <h3>Playable Games</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            {GAMES_CATALOG.map((game) => (
                <li key={game.id}>
                    <a href={`/game/${game.id}/`} className="hover:text-neon-blue transition-colors">{game.title}</a>
                </li>
            ))}
        </ul>

        <h3>Spacebar Games & Tools</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            <li><a href="/spacebar-games/" className="hover:text-neon-blue transition-colors font-bold text-neon-blue">Spacebar Games Hub</a></li>
            <li><a href="/spacebar-clicker/" className="hover:text-neon-blue transition-colors font-bold text-neon-blue">Spacebar Clicker</a></li>
            <li><a href="/spacebar-clicker-2/" className="hover:text-neon-blue transition-colors">Spacebar Clicker 2</a></li>
            <li><a href="/spacebar-counter/" className="hover:text-neon-blue transition-colors">Spacebar Counter</a></li>
            <li><a href="/spacebar-clicker-test/" className="hover:text-neon-blue transition-colors">Spacebar Clicker Test</a></li>
            <li><a href="/spacebar-clicker-unblocked/" className="hover:text-neon-blue transition-colors">Spacebar Clicker Instant Browser Mode</a></li>
        </ul>

        <h3>Guides & Site Resources</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            <li><a href="/compare/" className="hover:text-neon-blue transition-colors">Game Feature Comparison</a></li>
            <li><a href="/achievements/" className="hover:text-neon-green transition-colors">Galaxy Miner Milestones</a></li>
            <li><a href="/blog/" className="hover:text-neon-blue transition-colors">Mission Logs (Blog)</a></li>
            <li><a href="/about/" className="hover:text-neon-blue transition-colors">About Us</a></li>
            <li><a href="/contact/" className="hover:text-neon-blue transition-colors">Contact</a></li>
            <li><a href="/privacy/" className="hover:text-neon-blue transition-colors">Privacy Policy</a></li>
            <li><a href="/terms/" className="hover:text-neon-blue transition-colors">Terms of Service</a></li>
            <li><a href="/cookies/" className="hover:text-neon-blue transition-colors">Cookie & Local Storage Settings</a></li>
        </ul>

        <h3>Mission Logs</h3>
        <ul className="space-y-3 text-base">
            {BLOG_POST_META.map((post) => (
                <li key={post.slug}>
                    <a href={`/blog/${post.slug}/`} className="hover:text-neon-blue transition-colors">{post.title}</a>
                </li>
            ))}
        </ul>
    </PageContainer>
);
