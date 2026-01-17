'use client';

import { useState, useEffect } from 'react';
import { GameState, LunarMap, OutpostType, Position } from '@/lib/types';
import { initializeGameState, addOutpost, moveOutpost, removeOutpost, confirmAllOutposts, advanceTurn, undoTurn } from '@/lib/gameLogic';
import { generateLunarMap } from '@/lib/mapGenerator';
import { evaluateConstraintsFull, calculateScores, checkCommConnectivity } from '@/lib/constraints';
import LunarMapCanvas from '@/components/LunarMapCanvas';
import OutpostPalette from '@/components/OutpostPalette';
import StatusPanel from '@/components/StatusPanel';

type GamePhase = 'title' | 'play' | 'result';

export default function Home() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [lunarMap, setLunarMap] = useState<LunarMap>(generateLunarMap(0));
  const [selectedOutpostType, setSelectedOutpostType] = useState<OutpostType | null>(null);
  const [selectedOutpostId, setSelectedOutpostId] = useState<string | null>(null);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showSolar, setShowSolar] = useState(false);
  const [showResource, setShowResource] = useState(false);

  // ゲーム状態更新時に評価
  useEffect(() => {
    if (gamePhase === 'play') {
      const constraints = evaluateConstraintsFull(gameState, lunarMap);
      const { links } = checkCommConnectivity(gameState);
      const scores = calculateScores(gameState, lunarMap, constraints);

      setGameState((prev) => ({
        ...prev,
        commLinks: links,
        scores,
        outposts: prev.outposts.map((outpost) => ({
          ...outpost,
          isUnstable: constraints.warnings.some((w) => w.includes(outpost.id)),
        })),
      }));
    }
  }, [gameState.outposts, gameState.day]);

  const handleStartGame = () => {
    const newState = initializeGameState();
    const newMap = generateLunarMap(0);
    setGameState(newState);
    setLunarMap(newMap);
    setGamePhase('play');
  };

  const handleCellClick = (position: Position) => {
    if (selectedOutpostType) {
      const newState = addOutpost(gameState, selectedOutpostType, position);
      setGameState(newState);
      setSelectedOutpostType(null);
    }
  };

  const handleOutpostDragEnd = (outpostId: string, position: Position) => {
    const newState = moveOutpost(gameState, outpostId, position);
    setGameState(newState);
  };

  const handleRemoveOutpost = () => {
    if (selectedOutpostId) {
      const newState = removeOutpost(gameState, selectedOutpostId);
      setGameState(newState);
      setSelectedOutpostId(null);
    }
  };

  const handleConfirmTurn = () => {
    const confirmed = confirmAllOutposts(gameState);
    const advanced = advanceTurn(confirmed);
    const newMap = generateLunarMap(advanced.day);
    setGameState(advanced);
    setLunarMap(newMap);

    if (advanced.day >= advanced.mission.duration) {
      setGamePhase('result');
    }
  };

  const handleUndo = () => {
    const previous = undoTurn(gameState);
    if (previous) {
      setGameState(previous);
      setLunarMap(generateLunarMap(previous.day));
    }
  };

  if (gamePhase === 'title') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            Lunar Outpost Optimizer
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            月面に最適な前線基地を建設せよ
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            拠点配置は「場所選び」ではなく「制約の折り合い」である
          </p>
          <button
            onClick={handleStartGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            ミッション開始
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-8 p-8 bg-gray-800 rounded-lg max-w-2xl">
          <h1 className="text-4xl font-bold text-white">ミッション完了</h1>
          <div className="space-y-4">
            <div>
              <div className="text-gray-400 text-sm mb-2">総合スコア</div>
              <div className="text-6xl font-bold text-yellow-400">
                {gameState.scores.overall.toFixed(0)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-xs mb-1">コスト効率</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {gameState.scores.cost.toFixed(0)}
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-xs mb-1">生存性</div>
                <div className="text-2xl font-bold text-green-400">
                  {gameState.scores.survival.toFixed(0)}
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-xs mb-1">科学成果</div>
                <div className="text-2xl font-bold text-blue-400">
                  {gameState.scores.science.toFixed(0)}
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-gray-400 text-xs mb-1">安定性</div>
                <div className="text-2xl font-bold text-purple-400">
                  {gameState.scores.stability.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setGamePhase('title')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            タイトルに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <StatusPanel gameState={gameState} />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <OutpostPalette
              onSelectOutpostType={setSelectedOutpostType}
              budget={gameState.budget}
            />

            <div className="mt-4 bg-gray-800 p-4 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">表示切替</h3>
              <button
                onClick={() => {
                  setShowTerrain(true);
                  setShowSolar(false);
                  setShowResource(false);
                }}
                className={`w-full px-3 py-2 rounded text-sm ${
                  showTerrain ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                地形
              </button>
              <button
                onClick={() => {
                  setShowTerrain(false);
                  setShowSolar(true);
                  setShowResource(false);
                }}
                className={`w-full px-3 py-2 rounded text-sm ${
                  showSolar ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                日照
              </button>
              <button
                onClick={() => {
                  setShowTerrain(false);
                  setShowSolar(false);
                  setShowResource(true);
                }}
                className={`w-full px-3 py-2 rounded text-sm ${
                  showResource ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                資源
              </button>
            </div>

            <div className="mt-4 bg-gray-800 p-4 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">操作</h3>
              <button
                onClick={handleConfirmTurn}
                disabled={gameState.outposts.length === 0}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 rounded font-semibold transition-colors"
              >
                ターン確定
              </button>
              <button
                onClick={handleUndo}
                disabled={gameState.history.length === 0}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition-colors"
              >
                元に戻す
              </button>
              {selectedOutpostId && (
                <button
                  onClick={handleRemoveOutpost}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors"
                >
                  拠点を削除
                </button>
              )}
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-gray-800 p-4 rounded-lg">
              <LunarMapCanvas
                map={lunarMap}
                outposts={gameState.outposts}
                commLinks={gameState.commLinks}
                onCellClick={handleCellClick}
                onOutpostDragEnd={handleOutpostDragEnd}
                selectedOutpostId={selectedOutpostId}
                showTerrain={showTerrain}
                showSolar={showSolar}
                showResource={showResource}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
