
import React, { useState } from 'react';

interface SocialShareProps {
    title: string;
    url?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ title, url }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = url || window.location.href;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-3 py-6 border-t border-white/10 mt-8">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Share Transmissions</span>
            <div className="flex gap-2">
                {/* Twitter / X */}
                <a 
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=SpaceClickerGame,IdleGame`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-space-800 hover:bg-black border border-white/10 hover:border-white/30 rounded text-xs text-gray-300 transition-colors"
                    aria-label="Share on X (Twitter)"
                >
                    <span>𝕏</span>
                    <span className="hidden md:inline">Post</span>
                </a>

                {/* Reddit */}
                <a 
                    href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-space-800 hover:bg-[#ff4500] hover:text-white border border-white/10 hover:border-[#ff4500] rounded text-xs text-gray-300 transition-colors group"
                    aria-label="Share on Reddit"
                >
                    <span>●</span>
                    <span className="hidden md:inline">Reddit</span>
                </a>

                {/* Copy Link */}
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-space-800 hover:bg-neon-blue hover:text-black border border-white/10 hover:border-neon-blue rounded text-xs text-gray-300 transition-colors ml-auto"
                >
                    <span>{copied ? '✓' : '🔗'}</span>
                    <span className="hidden md:inline">{copied ? 'COPIED' : 'COPY LINK'}</span>
                </button>
            </div>
        </div>
    );
};

export default SocialShare;
