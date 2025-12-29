
import React from 'react';
import { GameMeta } from '../types';
import { BLOG_POSTS } from '../constants'; // Import BLOG_POSTS

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
    <PageContainer title="ABOUT VOID EXPANSE">
        <p className="lead text-xl text-gray-200">
            Welcome to <strong>SpaceClickerGame.com</strong>, the premier destination for high-fidelity browser-based strategy simulations.
        </p>
        
        <h3>Our Mission</h3>
        <p>
            Launched in late 2024, Void Expanse was built with a single directive: to redefine the <strong>space clicker game</strong> genre. We believe idle games shouldn't just be about watching numbers go up—they should be about immersion, discovery, and intergalactic scale.
        </p>
        <p>
            Whether you are mining stardust in <em>Galaxy Miner</em>, terraforming the Red Planet in <em>Mars Colony</em>, or defending against xeno-threats, our platform offers a persistent, interconnected universe that lives in your browser. No downloads, no paywalls, just pure infinite progression.
        </p>

        <h3>The Technology</h3>
        <p>
            Void Expanse utilizes cutting-edge web technologies (React 19, TailwindCSS, and hardware-accelerated Canvas API) to deliver console-quality UI and particle effects directly to your screen. We are constantly pushing the boundaries of what a <strong>free online game</strong> can look and feel like.
        </p>

        <div className="bg-space-800 p-6 rounded-lg border-l-4 border-neon-blue my-8">
            <h4 className="m-0 mb-2 text-neon-blue">System Status</h4>
            <ul className="list-none p-0 m-0 text-sm font-mono">
                <li>Current Date: 2025-12-29</li>
                <li>Active Players: 14,000+</li>
                <li>Galaxies Explored: 6</li>
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
            When contacting support regarding a save file issue, please include your <strong>User ID</strong> (found in the Settings menu) and a brief description of the anomaly. We aim to respond to all subspace signals within 24 standard hours.
        </p>
    </PageContainer>
);

export const PrivacyPage = () => (
    <PageContainer title="DATA PRIVACY PROTOCOLS">
        <p className="text-sm font-mono text-gray-500">Effective Date: December 29, 2025</p>
        
        <p>
            At <strong>SpaceClickerGame.com</strong>, we take your privacy as seriously as we take our shield integrity. This Privacy Policy explains how we collect, use, and protect your information when you access our <strong>space clicker games</strong>.
        </p>

        <h3>1. Information Collection</h3>
        <p>
            <strong>Local Game Data:</strong> Void Expanse is primarily a client-side experience. Your game progress (resources mined, buildings constructed, upgrades unlocked) is stored locally on your device using browser LocalStorage. This data does not leave your device unless you explicitly export a save string.
        </p>
        <p>
            <strong>Analytics:</strong> We use anonymous third-party analytics (such as Google Analytics 4) to understand how commanders interact with the website. This helps us optimize gameplay balance and server performance. We do not collect Personally Identifiable Information (PII) like your name or physical address.
        </p>

        <h3>2. Use of Information</h3>
        <p>
            Any data collected is used strictly for:
        </p>
        <ul>
            <li>Ensuring the stability and performance of the game engine.</li>
            <li>Analyzing gameplay trends to develop new features (e.g., "Which upgrades are most popular?").</li>
            <li>Serving non-intrusive, relevant advertisements to keep the game free to play.</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>
            We implement standard encryption protocols (HTTPS) to ensure your connection to <strong>spaceclickergame.com</strong> is secure. However, please remember that no transmission over the interstellar network (Internet) is 100% secure.
        </p>

        <h3>4. Contact Us</h3>
        <p>
            If you have questions about these protocols, please contact Command at <a href="mailto:info@spaceclickergame.com">info@spaceclickergame.com</a>.
        </p>
    </PageContainer>
);

export const TermsPage = () => (
    <PageContainer title="TERMS OF SERVICE">
        <p className="text-sm font-mono text-gray-500">Last Updated: December 29, 2025</p>

        <h3>1. Acceptance of Terms</h3>
        <p>
            By accessing <strong>SpaceClickerGame.com</strong> ("the Site"), you agree to abide by these Terms of Service. If you do not agree to these terms, please disconnect from the simulation immediately.
        </p>

        <h3>2. Use License</h3>
        <p>
            Permission is granted to temporarily access the materials (games and software) on Void Expanse for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title. You may not:
        </p>
        <ul>
            <li>Modify or copy the game assets for commercial distribution.</li>
            <li>Attempt to reverse engineer any software contained on the Site.</li>
            <li>Use the Site for any malicious mining scripts or botnets that degrade service for others.</li>
        </ul>

        <h3>3. Disclaimer</h3>
        <p>
            The materials on Void Expanse are provided on an 'as is' basis. We make no warranties, expressed or implied, regarding the stability of your galactic empire. We are not responsible for save data loss due to browser cache clearing or supernova events.
        </p>

        <h3>4. Limitations</h3>
        <p>
            In no event shall Void Expanse or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on the Site.
        </p>

        <h3>5. Governing Law</h3>
        <p>
            These terms are governed by and construed in accordance with the laws of Planet Earth, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>
    </PageContainer>
);

export const CookiesPage = () => (
    <PageContainer title="COOKIE & STORAGE SETTINGS">
        <p>
            Unlike the "cookies" you might find in a mess hall, digital cookies are small text files stored on your device. <strong>SpaceClickerGame.com</strong> uses these technologies to ensure your game progress is saved and to provide a seamless experience.
        </p>

        <h3>1. Essential Local Storage</h3>
        <p>
            We use the browser's <code>localStorage</code> API to save your game state. This is critical for the functionality of our <strong>idle game</strong> mechanics. Without this, your empire would vanish every time you closed the tab.
        </p>
        <ul>
            <li><strong>Key:</strong> <code>cosmic-miner-save-v2</code> (Main Game Data)</li>
            <li><strong>Key:</strong> <code>mars_colony_save_v2</code> (Mars Colony Data)</li>
            <li><strong>Key:</strong> <code>star_defense_save_v4</code> (Defense Data)</li>
        </ul>
        <p><em>These files are strictly functional and contain no personal tracking data.</em></p>

        <h3>2. Analytics Cookies</h3>
        <p>
            We may use trusted third-party services (like Google Analytics) that set cookies to help us analyze traffic. These cookies track anonymous data such as session duration, pages visited, and general geographic region.
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
                    if(window.confirm("WARNING: This will wipe all game progress across all Void Expanse games. Are you sure?")) {
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

export const SitemapPage: React.FC<{ games: GameMeta[] }> = ({ games }) => (
    <PageContainer title="SYSTEM SITEMAP">
        <p>Index of all active simulations, strategy guides, and informational terminals on SpaceClickerGame.com.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            <div>
                <h3>Game Simulations</h3>
                <ul className="space-y-4 list-none pl-0">
                    {games.map(game => (
                        <li key={game.id} className="border-b border-white/10 pb-4">
                            <a href={`/?game=${game.id}`} className="text-xl font-bold text-neon-blue no-underline hover:underline">
                                {game.title}
                            </a>
                            <p className="text-sm text-gray-400 mt-1 m-0">{game.description}</p>
                        </li>
                    ))}
                </ul>

                <h3 className="mt-8">Galactic Archives (Blog)</h3>
                <ul className="space-y-2 list-none pl-0">
                    {BLOG_POSTS.map(post => (
                        <li key={post.slug} className="mb-2">
                            <a href={`/?view=blog&post=${post.slug}`} className="text-gray-300 hover:text-neon-blue transition-colors flex justify-between gap-4">
                                <span>{post.title}</span>
                                <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{post.date}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div>
                <h3>Information Terminals</h3>
                <ul className="space-y-2">
                    <li><a href="/?view=home">Home Command</a></li>
                    <li><a href="/?view=blog">Blog Archives</a></li>
                    <li><a href="/?view=about">About / Mission</a></li>
                    <li><a href="/?view=contact">Contact Signals</a></li>
                    <li><a href="/?view=privacy">Data Privacy</a></li>
                    <li><a href="/?view=terms">Terms of Service</a></li>
                    <li><a href="/?view=cookies">Storage Settings</a></li>
                </ul>
                
                <h3 className="mt-8">External Uplinks</h3>
                <ul className="space-y-2">
                    <li><a href="#" rel="nofollow">Official Discord</a></li>
                    <li><a href="#" rel="nofollow">Twitter Command</a></li>
                    <li><a href="#" rel="nofollow">Reddit Frequencies</a></li>
                </ul>
            </div>
        </div>
    </PageContainer>
);
