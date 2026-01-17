import { LunarMap, Cell, Position } from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';

// パーリンノイズ風の簡易ノイズ生成
function simpleNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// 複数オクターブのノイズ
function octaveNoise(x: number, y: number, octaves: number, seed: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += simpleNoise(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// クレーター生成
function generateCraters(width: number, height: number): Array<{x: number, y: number, radius: number, depth: number}> {
  const craters = [];
  const craterCount = Math.floor((width * height) / 400); // 密度調整

  for (let i = 0; i < craterCount; i++) {
    craters.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 8,
      depth: 0.3 + Math.random() * 0.7,
    });
  }

  return craters;
}

// クレーター影響を計算
function getCraterInfluence(x: number, y: number, craters: Array<{x: number, y: number, radius: number, depth: number}>): number {
  let influence = 0;

  for (const crater of craters) {
    const dx = x - crater.x;
    const dy = y - crater.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < crater.radius) {
      // クレーター内部：深さに応じて暗くなる
      const normalized = dist / crater.radius;
      influence -= crater.depth * (1 - normalized * normalized);
    } else if (dist < crater.radius * 1.5) {
      // クレーターの縁：少し明るくなる（盛り上がり）
      const normalized = (dist - crater.radius) / (crater.radius * 0.5);
      influence += 0.2 * (1 - normalized);
    }
  }

  return influence;
}

// 日照計算（時刻と位置による）
function calculateSolar(x: number, y: number, day: number): {
  currentPower: number;
  averagePower: number;
  minPower: number;
  visibility: number;
} {
  // 地形による基礎日照率
  const baseVisibility = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 3, 100);

  // 緯度による影響（極地域は低い）
  const latitudeFactor = 1 - Math.abs(y / MAP_HEIGHT - 0.5) * 0.5;

  // 昼夜周期（14日）
  const dayPhase = (day % 14) / 14;
  const isDaytime = dayPhase < 0.5;
  const dayFactor = isDaytime ? 1 : 0.1;

  const visibility = baseVisibility * latitudeFactor;
  const currentPower = visibility * dayFactor * 100;
  const averagePower = visibility * 55; // 昼夜平均
  const minPower = visibility * 10; // 夜間最低値

  return {
    currentPower,
    averagePower,
    minPower,
    visibility,
  };
}

// 地形評価計算
function calculateTerrain(x: number, y: number, craters: Array<{x: number, y: number, radius: number, depth: number}>): {
  buildCost: number;
  roughness: number;
  slope: number;
} {
  const baseRoughness = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 4, 200);
  const slope = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 2, 300) * 0.8;

  // クレーター影響を追加
  const craterInfluence = getCraterInfluence(x, y, craters);
  const roughness = Math.max(0, Math.min(1, baseRoughness + Math.abs(craterInfluence) * 0.5));

  // 建設コスト倍率（1.0 ~ 3.0）
  const buildCost = 1 + roughness * 1.5 + slope * 0.5;

  return {
    buildCost,
    roughness,
    slope,
  };
}

// 資源評価計算
function calculateResource(x: number, y: number): {
  expectedValue: number;
  uncertainty: number;
} {
  const resourceNoise = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 3, 400);

  // 資源の期待値
  const expectedValue = resourceNoise * 100;

  // 不確実性（探査前は高い）
  const uncertainty = 0.5 + octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 2, 500) * 0.5;

  return {
    expectedValue,
    uncertainty,
  };
}

// クレーターを保持（一度だけ生成）
let cachedCraters: Array<{x: number, y: number, radius: number, depth: number}> | null = null;

// 月面マップ生成
export function generateLunarMap(day: number = 0): LunarMap {
  // クレーターは初回のみ生成
  if (!cachedCraters) {
    cachedCraters = generateCraters(MAP_WIDTH, MAP_HEIGHT);
  }

  const cells: Cell[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const position: Position = { x, y };
      const terrain = calculateTerrain(x, y, cachedCraters);
      const solar = calculateSolar(x, y, day);
      const resource = calculateResource(x, y);

      row.push({
        position,
        terrain,
        solar,
        resource,
      });
    }
    cells.push(row);
  }

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    cells,
  };
}

// 特定位置のセル取得
export function getCell(map: LunarMap, position: Position): Cell | null {
  if (
    position.x < 0 ||
    position.x >= map.width ||
    position.y < 0 ||
    position.y >= map.height
  ) {
    return null;
  }
  return map.cells[position.y][position.x];
}

// 距離計算
export function calculateDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
