
import React, { useEffect, useRef, useState } from 'react';

interface SocialShareProps {
    title: string;
    url?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ title, url }) => {
    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef<number>();

    useEffect(() => {
        return () => {
            if (copiedTimerRef.current !== undefined) {
                window.clearTimeout(copiedTimerRef.current);
            }
        };
    }, []);

    const shareUrl = url || window.location.href;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            if (copiedTimerRef.current !== undefined) {
                window.clearTimeout(copiedTimerRef.current);
            }
            copiedTimerRef.current = window.setTimeout(() => {
                copiedTimerRef.current = undefined;
                setCopied(false);
            }, 2000);
        } catch {
            window.prompt('Copy this link:', shareUrl);
        }
    };

    const handleNativeShare = async () => {
        if (!navigator.share) return;
        try {
            await navigator.share({ title, url: shareUrl });
        } catch (error) {
            if ((error as DOMException)?.name !== 'AbortError') {
                window.prompt('Copy this link:', shareUrl);
            }
        }
    };

    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    return (
        <div className="flex flex-col gap-3 py-6 border-t border-white/10 mt-8">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Share Transmissions</span>
            <div className="flex gap-2">
                {canNativeShare && (
                    <button
                        type="button"
                        onClick={handleNativeShare}
                        className="flex items-center gap-2 px-4 py-2 bg-space-800 hover:bg-neon-blue hover:text-black border border-white/10 hover:border-neon-blue rounded text-xs text-gray-300 transition-colors"
                    >
                        <span aria-hidden="true">↗</span>
                        <span className="hidden md:inline">Share</span>
                    </button>
                )}

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
                    type="button"
                    aria-label={copied ? 'Link copied' : 'Copy article link'}
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-space-800 hover:bg-neon-blue hover:text-black border border-white/10 hover:border-neon-blue rounded text-xs text-gray-300 transition-colors ml-auto"
                >
                    <span aria-hidden="true">{copied ? '✓' : '🔗'}</span>
                    <span className="hidden md:inline" aria-live="polite">{copied ? 'COPIED' : 'COPY LINK'}</span>
                </button>
            </div>
        </div>
    );
};

export default SocialShare;
