
import React, { useEffect } from 'react';
import { ViewMode } from './SiteLayout';

interface NotFoundPageProps {
    onNavigate: (view: ViewMode) => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
    
    // SEO: Tell bots not to index this error page
    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = "robots";
        meta.content = "noindex";
        document.head.appendChild(meta);
        
        document.title = "404 - Signal Lost | Space Clicker Game";

        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {/* Background Glitch Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>

            <div className="relative z-10 max-w-lg">
                <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-black mb-4 font-display tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    404
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-widest uppercase border-y-2 border-red-600 py-2">
                    Signal Lost
                </h1>
                
                <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    The coordinates you entered do not correspond to any known sector in the Void Expanse. The navigation computer assumes this is a user error or a corrupted hyperlane.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => onNavigate('home')}
                        className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-neon-blue transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        RETURN TO BASE
                    </button>
                    <button 
                        onClick={() => onNavigate('game')}
                        className="px-8 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-black transition-colors"
                    >
                        EMERGENCY WARP
                    </button>
                </div>
                
                <div className="mt-12 text-[10px] text-gray-600 font-mono">
                    ERROR_CODE: NULL_POINTER_EXCEPTION_IN_REALITY
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
