'use client';

import { GameState } from '@/lib/types';

interface StatusPanelProps {
  gameState: GameState;
}

export default function StatusPanel({ gameState }: StatusPanelProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400 text-xs mb-1">予算</div>
          <div className="text-2xl font-bold text-yellow-400">
            {gameState.budget}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">経過日数</div>
          <div className="text-2xl font-bold text-blue-400">
            {gameState.day} / {gameState.mission.duration}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">拠点数</div>
          <div className="text-xl font-bold text-gray-200">
            {gameState.outposts.length} / {gameState.mission.constraints.maxOutposts}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">総合評価</div>
          <div className="relative w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
              style={{ width: `${Math.min(100, gameState.scores.overall)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
              {gameState.scores.overall.toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
