'use client';

import { OutpostType } from '@/lib/types';
import { OUTPOST_METADATA } from '@/lib/constants';

interface OutpostPaletteProps {
  onSelectOutpostType: (type: OutpostType) => void;
  budget: number;
}

export default function OutpostPalette({
  onSelectOutpostType,
  budget,
}: OutpostPaletteProps) {
  const outpostTypes: OutpostType[] = ['command', 'power', 'mining', 'research', 'comm'];

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-2">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">拠点パレット</h3>
      {outpostTypes.map((type) => {
        const metadata = OUTPOST_METADATA[type];
        const canAfford = budget >= metadata.cost;

        return (
          <button
            key={type}
            onClick={() => onSelectOutpostType(type)}
            disabled={!canAfford}
            className={`w-full p-3 rounded-md text-left transition-all ${
              canAfford
                ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                : 'bg-gray-900 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{metadata.icon}</span>
                <span className="text-sm font-medium text-gray-200">
                  {metadata.name}
                </span>
              </div>
              <span className="text-xs font-bold text-yellow-400">
                {metadata.cost}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-1">
              {metadata.description}
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              {metadata.powerGeneration > 0 && (
                <span className="text-green-400">
                  ⚡ +{metadata.powerGeneration}
                </span>
              )}
              {metadata.powerConsumption > 0 && (
                <span className="text-red-400">
                  ⚡ -{metadata.powerConsumption}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
