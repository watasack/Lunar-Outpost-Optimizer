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
function calculateTerrain(x: number, y: number): {
  buildCost: number;
  roughness: number;
  slope: number;
} {
  const roughness = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 4, 200);
  const slope = octaveNoise(x / MAP_WIDTH, y / MAP_HEIGHT, 2, 300) * 0.8;

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

// 月面マップ生成
export function generateLunarMap(day: number = 0): LunarMap {
  const cells: Cell[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const position: Position = { x, y };
      const terrain = calculateTerrain(x, y);
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
