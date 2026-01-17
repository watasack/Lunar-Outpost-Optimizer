// 拠点タイプ
export type OutpostType =
  | 'command'     // 司令拠点
  | 'power'       // 発電拠点
  | 'mining'      // 採掘拠点
  | 'research'    // 研究拠点
  | 'comm';       // 通信拠点

// 拠点状態
export type OutpostStatus = 'confirmed' | 'provisional';

// 座標
export interface Position {
  x: number;
  y: number;
}

// 拠点
export interface Outpost {
  id: string;
  type: OutpostType;
  position: Position;
  status: OutpostStatus;
  isUnstable?: boolean;
  warnings?: string[];
}

// 拠点メタデータ
export interface OutpostMetadata {
  type: OutpostType;
  name: string;
  powerConsumption: number;
  powerGeneration: number;
  cost: number;
  description: string;
  icon: string;
}

// 地形評価
export interface TerrainEvaluation {
  buildCost: number;        // 建設コスト倍率
  roughness: number;        // 地形の荒さ (0-1)
  slope: number;            // 傾斜 (0-1)
}

// 日照評価
export interface SolarEvaluation {
  currentPower: number;     // 現在の発電量
  averagePower: number;     // 平均発電量
  minPower: number;         // 最低発電量
  visibility: number;       // 日照率 (0-1)
}

// 資源評価
export interface ResourceEvaluation {
  expectedValue: number;    // 期待値
  uncertainty: number;      // 不確実性 (0-1)
  actualValue?: number;     // 実際の値（探査後）
}

// 通信接続
export interface CommLink {
  from: string;
  to: string;
  distance: number;
  quality: number;          // 通信品質 (0-1)
  isUnstable?: boolean;
}

// 輸送フロー
export interface TransportFlow {
  from: string;
  to: string;
  amount: number;
  capacity: number;
  cost: number;
}

// ミッション
export interface Mission {
  id: string;
  name: string;
  description: string;
  budget: number;
  targetScience: number;
  duration: number;         // ターン数
  constraints: {
    maxOutposts: number;
    requiredTypes: OutpostType[];
  };
}

// ゲーム状態
export interface GameState {
  mission: Mission;
  day: number;
  budget: number;
  outposts: Outpost[];
  commLinks: CommLink[];
  transportFlows: TransportFlow[];
  scores: {
    cost: number;
    survival: number;
    science: number;
    stability: number;
    overall: number;
  };
  history: GameState[];
}

// セル（月面マップのグリッド）
export interface Cell {
  position: Position;
  terrain: TerrainEvaluation;
  solar: SolarEvaluation;
  resource: ResourceEvaluation;
}

// 月面マップ
export interface LunarMap {
  width: number;
  height: number;
  cells: Cell[][];
}

// 制約評価結果
export interface ConstraintResult {
  isValid: boolean;
  powerBalance: number;     // 電力収支
  commConnectivity: boolean; // 通信連結性
  buildability: boolean;    // 建設可能性
  warnings: string[];
  stability: number;        // 安定性スコア (0-1)
}
