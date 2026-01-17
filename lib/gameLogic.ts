import { GameState, Outpost, Position, OutpostType } from './types';
import { OUTPOST_METADATA, MVP_MISSION } from './constants';

// ゲーム状態初期化
export function initializeGameState(): GameState {
  return {
    mission: MVP_MISSION,
    day: 0,
    budget: MVP_MISSION.budget,
    outposts: [],
    commLinks: [],
    transportFlows: [],
    scores: {
      cost: 100,
      survival: 0,
      science: 0,
      stability: 0,
      overall: 0,
    },
    history: [],
  };
}

// 拠点追加
export function addOutpost(
  state: GameState,
  type: OutpostType,
  position: Position
): GameState {
  const metadata = OUTPOST_METADATA[type];
  const newOutpost: Outpost = {
    id: `outpost-${Date.now()}-${Math.random()}`,
    type,
    position,
    status: 'provisional',
  };

  return {
    ...state,
    outposts: [...state.outposts, newOutpost],
    budget: state.budget - metadata.cost,
  };
}

// 拠点移動
export function moveOutpost(
  state: GameState,
  outpostId: string,
  newPosition: Position
): GameState {
  return {
    ...state,
    outposts: state.outposts.map((outpost) =>
      outpost.id === outpostId
        ? { ...outpost, position: newPosition, status: 'provisional' }
        : outpost
    ),
  };
}

// 拠点削除
export function removeOutpost(state: GameState, outpostId: string): GameState {
  const outpost = state.outposts.find((o) => o.id === outpostId);
  if (!outpost) return state;

  const metadata = OUTPOST_METADATA[outpost.type];

  return {
    ...state,
    outposts: state.outposts.filter((o) => o.id !== outpostId),
    budget: state.budget + metadata.cost * 0.5, // 撤去時は半額返金
    commLinks: state.commLinks.filter(
      (link) => link.from !== outpostId && link.to !== outpostId
    ),
  };
}

// 拠点確定
export function confirmOutpost(state: GameState, outpostId: string): GameState {
  return {
    ...state,
    outposts: state.outposts.map((outpost) =>
      outpost.id === outpostId
        ? { ...outpost, status: 'confirmed' }
        : outpost
    ),
  };
}

// すべての拠点を確定
export function confirmAllOutposts(state: GameState): GameState {
  return {
    ...state,
    outposts: state.outposts.map((outpost) => ({
      ...outpost,
      status: 'confirmed',
    })),
  };
}

// 1ターン進行
export function advanceTurn(state: GameState): GameState {
  // 履歴に現在状態を保存
  const newHistory = [...state.history, state];

  return {
    ...state,
    day: state.day + 1,
    history: newHistory,
  };
}

// Undo（1ターン戻る）
export function undoTurn(state: GameState): GameState | null {
  if (state.history.length === 0) return null;

  const previousState = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  return {
    ...previousState,
    history: newHistory,
  };
}

// 拠点取得
export function getOutpost(state: GameState, outpostId: string): Outpost | null {
  return state.outposts.find((o) => o.id === outpostId) || null;
}

// タイプ別拠点数取得
export function countOutpostsByType(state: GameState, type: OutpostType): number {
  return state.outposts.filter((o) => o.type === type).length;
}

// 予算チェック
export function canAfford(state: GameState, type: OutpostType): boolean {
  const metadata = OUTPOST_METADATA[type];
  return state.budget >= metadata.cost;
}

// ミッション制約チェック
export function checkMissionConstraints(state: GameState): {
  isValid: boolean;
  messages: string[];
} {
  const messages: string[] = [];
  let isValid = true;

  // 拠点数制限
  if (state.outposts.length > state.mission.constraints.maxOutposts) {
    messages.push(`拠点数が上限（${state.mission.constraints.maxOutposts}）を超えています`);
    isValid = false;
  }

  // 必須拠点タイプチェック
  for (const requiredType of state.mission.constraints.requiredTypes) {
    if (countOutpostsByType(state, requiredType) === 0) {
      messages.push(`${OUTPOST_METADATA[requiredType].name}が必要です`);
      isValid = false;
    }
  }

  return { isValid, messages };
}
