import React from 'react';
import { GAMES_CATALOG } from '../constants';
import { GameId } from '../types';

interface GameCarouselProps {
  onSelect: (id: GameId) => void;
  activeId: GameId;
}

const GameCarousel: React.FC<GameCarouselProps> = ({ onSelect, activeId }) => {
  return (
    <div className="w-full bg-space-950 border-y border-white/5 py-8">
       <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-lg font-display text-gray-400 mb-6 flex items-center gap-2">
             <span className="text-neon-blue">❖</span> EXPLORE MORE GALAXIES
          </h3>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
             {GAMES_CATALOG.map(game => (
                <div 
                   key={game.id}
                   onClick={() => onSelect(game.id)}
                   className={`
                      flex-shrink-0 w-64 h-32 rounded-lg border relative overflow-hidden cursor-pointer group snap-start transition-all
                      ${activeId === game.id ? 'border-neon-blue ring-2 ring-neon-blue/20' : 'border-white/10 hover:border-white/30'}
                   `}
                >
                   <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                   
                   <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <span className="text-2xl">{game.icon}</span>
                         {game.status === 'LIVE' && <span className="text-[9px] bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded font-bold">PLAY</span>}
                         {game.status !== 'LIVE' && <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-bold">{game.status}</span>}
                      </div>
                      <div>
                         <h4 className="font-bold text-white group-hover:text-neon-blue transition-colors truncate">{game.title}</h4>
                         <p className="text-[10px] text-gray-400 uppercase tracking-wider">{game.subtitle}</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default GameCarousel;