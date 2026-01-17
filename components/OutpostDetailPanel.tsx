'use client';

import { Outpost, LunarMap } from '@/lib/types';
import { OUTPOST_METADATA } from '@/lib/constants';
import { getCell } from '@/lib/mapGenerator';

interface OutpostDetailPanelProps {
  outpost: Outpost | null;
  map: LunarMap;
  onRemove?: () => void;
}

export default function OutpostDetailPanel({
  outpost,
  map,
  onRemove,
}: OutpostDetailPanelProps) {
  if (!outpost) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 h-32 flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          拠点を選択すると詳細が表示されます
        </p>
      </div>
    );
  }

  const metadata = OUTPOST_METADATA[outpost.type];
  const cell = getCell(map, outpost.position);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{metadata.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{metadata.name}</h3>
            <p className="text-sm text-gray-400">{metadata.description}</p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
          >
            削除
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-gray-500 text-xs mb-1">座標</div>
          <div className="text-white font-mono">
            ({outpost.position.x}, {outpost.position.y})
          </div>
        </div>

        <div className="bg-gray-900 p-3 rounded">
          <div className="text-gray-500 text-xs mb-1">状態</div>
          <div className="flex items-center gap-2">
            {outpost.status === 'confirmed' ? (
              <span className="text-green-400">✓ 確定</span>
            ) : (
              <span className="text-yellow-400">⚠ 仮配置</span>
            )}
          </div>
        </div>

        {cell && (
          <>
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-gray-500 text-xs mb-1">建設コスト</div>
              <div className="text-white font-bold">
                {(metadata.cost * cell.terrain.buildCost).toFixed(0)}
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-gray-500 text-xs mb-1">日照率</div>
              <div className="text-white">
                {(cell.solar.visibility * 100).toFixed(0)}%
              </div>
            </div>
          </>
        )}
      </div>

      {cell && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-gray-500 text-xs mb-2">電力</div>
            <div className="space-y-1">
              {metadata.powerGeneration > 0 && (
                <div className="text-green-400">
                  発電: +{cell.solar.currentPower.toFixed(0)} kW
                </div>
              )}
              {metadata.powerConsumption > 0 && (
                <div className="text-red-400">
                  消費: -{metadata.powerConsumption} kW
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded">
            <div className="text-gray-500 text-xs mb-2">地形評価</div>
            <div className="space-y-1 text-xs">
              <div>
                荒さ: {(cell.terrain.roughness * 100).toFixed(0)}%
              </div>
              <div>
                傾斜: {(cell.terrain.slope * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {outpost.warnings && outpost.warnings.length > 0 && (
        <div className="mt-4 bg-red-900/30 border border-red-600 rounded p-3">
          <div className="text-red-400 text-sm font-semibold mb-2">⚠ 警告</div>
          <ul className="text-xs text-red-300 space-y-1">
            {outpost.warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
