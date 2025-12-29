import React, { useState, useEffect } from 'react';
import { GameId } from '../types';
import { GAMES_CATALOG } from '../constants';

interface InterstellarCommsProps {
  activeGame: GameId;
  onSwitchGame: (id: GameId) => void;
}

const InterstellarComms: React.FC<InterstellarCommsProps> = ({ activeGame, onSwitchGame }) => {
  const [message, setMessage] = useState<{ text: string; targetGame: GameId; type: 'alert' | 'info' } | null>(null);

  useEffect(() => {
    // Schedule random transmissions
    const schedule = () => {
      // 30s to 2min interval
      const delay = Math.random() * 90000 + 30000;
      return setTimeout(() => {
        triggerRandomMessage();
      }, delay);
    };

    let timer = schedule();

    const triggerRandomMessage = () => {
      // Pick a game that is NOT the current one
      const others = GAMES_CATALOG.filter(g => g.id !== activeGame);
      if (others.length === 0) return;
      const target = others[Math.floor(Math.random() * others.length)];

      const scenarios = [
        { text: `⚠️ SECTOR 7 DISTRESS SIGNAL! Requesting backup in ${target.title}.`, type: 'alert' },
        { text: `📡 New trade route established in ${target.title}.`, type: 'info' },
        { text: `💬 Incoming transmission from ${target.title} Command.`, type: 'info' },
      ];
      
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      setMessage({
        text: scenario.text,
        targetGame: target.id,
        type: scenario.type as 'alert' | 'info'
      });

      // Auto dismiss after 8s
      setTimeout(() => setMessage(null), 8000);
      
      timer = schedule();
    };

    return () => clearTimeout(timer);
  }, [activeGame]);

  if (!message) return null;

  return (
    <div className="fixed bottom-28 right-4 z-[90] max-w-sm animate-in slide-in-from-right duration-500">
      <div className={`
        relative p-4 rounded-lg border backdrop-blur-md shadow-2xl cursor-pointer hover:scale-105 transition-transform
        ${message.type === 'alert' ? 'bg-red-900/80 border-red-500 text-red-100' : 'bg-space-800/80 border-neon-blue text-blue-100'}
      `}
      onClick={() => {
        onSwitchGame(message.targetGame);
        setMessage(null);
      }}
      >
        <div className="flex items-start gap-3">
           <div className={`mt-1 w-2 h-2 rounded-full animate-pulse ${message.type === 'alert' ? 'bg-red-500' : 'bg-neon-blue'}`}></div>
           <div>
              <h4 className="font-display font-bold text-sm tracking-wider mb-1">INCOMING TRANSMISSION</h4>
              <p className="text-xs leading-relaxed font-mono">{message.text}</p>
              <div className="mt-2 text-[10px] uppercase font-bold opacity-70 flex items-center gap-1">
                 <span>RESPOND</span>
                 <span>&rarr;</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InterstellarComms;