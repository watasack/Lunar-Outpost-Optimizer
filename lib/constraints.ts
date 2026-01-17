import { GameState, Outpost, LunarMap, ConstraintResult, CommLink } from './types';
import { OUTPOST_METADATA, MAX_COMM_DISTANCE } from './constants';
import { getCell, calculateDistance } from './mapGenerator';

// 電力収支計算
export function calculatePowerBalance(
  state: GameState,
  map: LunarMap
): number {
  let totalGeneration = 0;
  let totalConsumption = 0;

  for (const outpost of state.outposts) {
    const metadata = OUTPOST_METADATA[outpost.type];
    const cell = getCell(map, outpost.position);

    if (cell) {
      // 発電量は日照条件に依存
      if (metadata.powerGeneration > 0) {
        totalGeneration += cell.solar.currentPower;
      }
      totalConsumption += metadata.powerConsumption;
    }
  }

  return totalGeneration - totalConsumption;
}

// 通信グラフの連結性チェック（BFS）
export function checkCommConnectivity(
  state: GameState
): { isConnected: boolean; links: CommLink[] } {
  if (state.outposts.length === 0) {
    return { isConnected: true, links: [] };
  }

  // 司令拠点を探す
  const commandOutpost = state.outposts.find((o) => o.type === 'command');
  if (!commandOutpost) {
    return { isConnected: false, links: [] };
  }

  // 通信可能なリンクを生成
  const links: CommLink[] = [];
  const outpostMap = new Map(state.outposts.map((o) => [o.id, o]));

  for (let i = 0; i < state.outposts.length; i++) {
    for (let j = i + 1; j < state.outposts.length; j++) {
      const o1 = state.outposts[i];
      const o2 = state.outposts[j];
      const distance = calculateDistance(o1.position, o2.position);

      // 通信拠点がある場合は距離を延長
      const hasCommRelay = o1.type === 'comm' || o2.type === 'comm';
      const maxDistance = hasCommRelay ? MAX_COMM_DISTANCE * 1.5 : MAX_COMM_DISTANCE;

      if (distance <= maxDistance) {
        const quality = 1 - distance / maxDistance;
        links.push({
          from: o1.id,
          to: o2.id,
          distance,
          quality,
          isUnstable: quality < 0.5,
        });
      }
    }
  }

  // BFSで連結性チェック
  const visited = new Set<string>();
  const queue = [commandOutpost.id];
  visited.add(commandOutpost.id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    for (const link of links) {
      if (link.from === currentId && !visited.has(link.to)) {
        visited.add(link.to);
        queue.push(link.to);
      } else if (link.to === currentId && !visited.has(link.from)) {
        visited.add(link.from);
        queue.push(link.from);
      }
    }
  }

  const isConnected = visited.size === state.outposts.length;

  return { isConnected, links };
}

// 建設可能性チェック
export function checkBuildability(
  outpost: Outpost,
  map: LunarMap,
  budget: number
): { canBuild: boolean; reason?: string } {
  const cell = getCell(map, outpost.position);
  if (!cell) {
    return { canBuild: false, reason: 'マップ範囲外' };
  }

  const metadata = OUTPOST_METADATA[outpost.type];
  const actualCost = metadata.cost * cell.terrain.buildCost;

  if (actualCost > budget) {
    return { canBuild: false, reason: '予算不足' };
  }

  // 地形が極端に荒い場合は建設不可
  if (cell.terrain.roughness > 0.9 || cell.terrain.slope > 0.9) {
    return { canBuild: false, reason: '地形が険しすぎる' };
  }

  return { canBuild: true };
}

// 制約評価（軽量版：ドラッグ中）
export function evaluateConstraintsLight(
  state: GameState,
  map: LunarMap
): ConstraintResult {
  const warnings: string[] = [];
  let stability = 1.0;

  // 建設可能性チェック
  const provisionalOutposts = state.outposts.filter(
    (o) => o.status === 'provisional'
  );

  for (const outpost of provisionalOutposts) {
    const buildCheck = checkBuildability(outpost, map, state.budget);
    if (!buildCheck.canBuild) {
      warnings.push(`${OUTPOST_METADATA[outpost.type].name}: ${buildCheck.reason}`);
      stability -= 0.3;
    }
  }

  return {
    isValid: warnings.length === 0,
    powerBalance: 0, // 軽量版では計算しない
    commConnectivity: true, // 軽量版ではチェックしない
    buildability: warnings.length === 0,
    warnings,
    stability: Math.max(0, stability),
  };
}

// 制約評価（完全版：配置確定時）
export function evaluateConstraintsFull(
  state: GameState,
  map: LunarMap
): ConstraintResult {
  const warnings: string[] = [];
  let stability = 1.0;

  // 電力収支チェック
  const powerBalance = calculatePowerBalance(state, map);
  if (powerBalance < 0) {
    warnings.push(`電力不足: ${Math.abs(powerBalance).toFixed(0)} kW`);
    stability -= 0.4;
  } else if (powerBalance < 50) {
    warnings.push('電力に余裕がありません');
    stability -= 0.2;
  }

  // 通信連結性チェック
  const { isConnected, links } = checkCommConnectivity(state);
  if (!isConnected && state.outposts.length > 1) {
    warnings.push('すべての拠点が通信で接続されていません');
    stability -= 0.5;
  }

  // 不安定なリンク数
  const unstableLinks = links.filter((l) => l.isUnstable).length;
  if (unstableLinks > 0) {
    warnings.push(`通信リンクが不安定: ${unstableLinks}本`);
    stability -= unstableLinks * 0.1;
  }

  // 建設可能性チェック
  for (const outpost of state.outposts) {
    const buildCheck = checkBuildability(outpost, map, Infinity); // コストは別でチェック済み
    if (!buildCheck.canBuild && buildCheck.reason !== '予算不足') {
      warnings.push(`${OUTPOST_METADATA[outpost.type].name}: ${buildCheck.reason}`);
      stability -= 0.3;
    }
  }

  return {
    isValid: powerBalance >= 0 && isConnected,
    powerBalance,
    commConnectivity: isConnected,
    buildability: true,
    warnings,
    stability: Math.max(0, Math.min(1, stability)),
  };
}

// スコア計算
export function calculateScores(
  state: GameState,
  map: LunarMap,
  constraints: ConstraintResult
): GameState['scores'] {
  // コストスコア（予算残高）
  const costScore = (state.budget / state.mission.budget) * 100;

  // 生存スコア（電力とシステム安定性）
  const survivalScore = constraints.stability * 100;

  // 科学スコア（研究拠点と資源採掘）
  const researchCount = state.outposts.filter((o) => o.type === 'research').length;
  const miningCount = state.outposts.filter((o) => o.type === 'mining').length;
  const scienceScore = (researchCount * 30 + miningCount * 20);

  // 統合スコア
  const overall = (
    costScore * 0.2 +
    survivalScore * 0.3 +
    scienceScore * 0.3 +
    constraints.stability * 100 * 0.2
  );

  return {
    cost: costScore,
    survival: survivalScore,
    science: scienceScore,
    stability: constraints.stability * 100,
    overall,
  };
}
