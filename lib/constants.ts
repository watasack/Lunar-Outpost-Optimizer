import { OutpostMetadata, Mission } from './types';

// 拠点メタデータ
export const OUTPOST_METADATA: Record<string, OutpostMetadata> = {
  command: {
    type: 'command',
    name: '司令拠点',
    powerConsumption: 50,
    powerGeneration: 0,
    cost: 100,
    description: '全体を統括する中核拠点',
    icon: '🏛️',
  },
  power: {
    type: 'power',
    name: '発電拠点',
    powerConsumption: 5,
    powerGeneration: 100,
    cost: 80,
    description: '太陽光発電で電力を供給',
    icon: '⚡',
  },
  mining: {
    type: 'mining',
    name: '採掘拠点',
    powerConsumption: 30,
    powerGeneration: 0,
    cost: 60,
    description: '資源を採掘する',
    icon: '⛏️',
  },
  research: {
    type: 'research',
    name: '研究拠点',
    powerConsumption: 40,
    powerGeneration: 0,
    cost: 90,
    description: '科学研究を実施',
    icon: '🔬',
  },
  comm: {
    type: 'comm',
    name: '通信拠点',
    powerConsumption: 20,
    powerGeneration: 0,
    cost: 70,
    description: '拠点間の通信を中継',
    icon: '📡',
  },
};

// 月の昼夜周期（地球日換算）
export const LUNAR_DAY_CYCLE = 14; // 14日周期

// 通信距離の制限
export const MAX_COMM_DISTANCE = 150; // グリッド単位

// マップサイズ
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

// MVPミッション
export const MVP_MISSION: Mission = {
  id: 'mvp-mission-01',
  name: '最初の前線基地',
  description: '月面に最初の持続可能な前線基地を建設せよ',
  budget: 500,
  targetScience: 100,
  duration: 28, // 月面での28日間
  constraints: {
    maxOutposts: 8,
    requiredTypes: ['command', 'power'],
  },
};

// スコア重み
export const SCORE_WEIGHTS = {
  cost: 0.2,
  survival: 0.3,
  science: 0.3,
  stability: 0.2,
};
