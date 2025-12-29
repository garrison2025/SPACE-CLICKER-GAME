
import React from 'react';
import { LogEntry } from '../types';

interface MissionLogProps {
  logs: LogEntry[];
}

const MissionLog: React.FC<MissionLogProps> = ({ logs }) => {
  return (
    <div className="absolute bottom-28 left-4 md:left-8 z-30 w-72 md:w-96 pointer-events-none font-mono select-none">
        <div className="flex items-center gap-2 mb-3 opacity-60">
            <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-pulse"></div>
            <h6 className="text-[10px] text-neon-blue tracking-[0.2em] uppercase font-bold">System Log // Live Feed</h6>
            <div className="h-px bg-neon-blue/20 flex-1"></div>
        </div>
        
        <div className="flex flex-col gap-1.5 relative">
            {/* Gradient mask for fading out old logs if we had a scroll, but here we just show top 5 */}
            {logs.slice(0, 6).map((log) => (
                <div 
                    key={log.id} 
                    className="text-[10px] md:text-xs leading-tight shadow-black drop-shadow-md animate-in fade-in slide-in-from-left-4 duration-500"
                >
                    <span className="text-gray-600 mr-2 font-light">
                        [{log.timestamp.toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]
                    </span>
                    <span className={`${
                        log.type === 'alert' ? 'text-red-500 font-bold' : 
                        log.type === 'success' ? 'text-neon-green' : 
                        log.type === 'event' ? 'text-yellow-400' : 'text-blue-100/80'
                    }`}>
                        {log.type === 'alert' && '⚠️ '}
                        {log.type === 'success' && '✓ '}
                        {log.message}
                    </span>
                </div>
            ))}
            {logs.length === 0 && (
                <div className="text-[10px] text-gray-700 italic flex items-center gap-2">
                    <span className="animate-pulse">_</span> 
                    Waiting for telemetry data...
                </div>
            )}
        </div>
    </div>
  );
};

export default MissionLog;
