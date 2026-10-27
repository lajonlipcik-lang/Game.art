// Core type definitions for the game "Железная Республика".

export type GroupId =
  | 'military'
  | 'business'
  | 'workers'
  | 'farmers'
  | 'intelligentsia'
  | 'clergy'
  | 'bureaucracy'
  | 'security';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type EndingId =
  | 'triumph'
  | 'revolution'
  | 'coup'
  | 'bankruptcy'
  | 'collapse'
  | 'overthrow_external';

export interface Group {
  id: GroupId;
  name: string;
  short: string;
  loyalty: number; // 0..100
  power: number; // 0..100 relative political weight
  icon: string; // lucide icon name
  color: string;
  interest: string;
}

export interface Country {
  id: string;
  name: string;
  flagColors: [string, string, string];
  // diplomatic relation baseline toward player (-100..100)
  relation: number;
  armyStrength: number; // 0..100
  trait: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  category: 'industry' | 'agriculture' | 'infrastructure' | 'military' | 'social';
  cost: number;
  daysToBuild: number;
  upkeep: number; // per turn
  income: number; // per turn once complete
  jobs: number; // jobs created
  requires?: string; // id of required upgrade
  description: string;
  icon: string;
}

export interface UpgradeDef {
  id: string;
  name: string;
  branch: 'economy' | 'military' | 'social' | 'civic';
  tier: number;
  cost: number;
  requires?: string;
  description: string;
  icon: string;
  effect: Partial<EconomicState> & { groupDeltas?: Partial<Record<GroupId, number>> };
}

export interface EventChoice {
  label: string;
  description: string;
  cost?: number;
  effects: {
    treasury?: number;
    stability?: number;
    approval?: number;
    unrest?: number;
    inflation?: number;
    unemployment?: number;
    growth?: number;
    debt?: number;
    industry?: number;
    agriculture?: number;
    infrastructure?: number;
    tradeBalance?: number;
    armyStrength?: number;
    defense?: number;
    security?: number;
    intelligence?: number;
    groups?: Partial<Record<GroupId, number>>;
    relations?: Record<string, number>; // countryId -> delta
    addUnrestReason?: string;
    queueEvent?: string; // event id to enqueue
    ending?: EndingId; // immediate ending on this outcome
  };
  outcomeText: string;
  // success probability 0..1; if <1 and roll fails, apply failureEffects instead
  successChance?: number;
  failureEffects?: EventChoice['effects'];
  failureText?: string;
}

export interface EventDef {
  id: string;
  title: string;
  body: string;
  category: 'economy' | 'politics' | 'military' | 'diplomacy' | 'social' | 'crisis';
  icon: string;
  weight: number;
  cooldown: number; // turns before it can appear again
  oncePerGame?: boolean;
  // conditions: all must be satisfied to be eligible
  conditions?: {
    minTurn?: number;
    maxTurn?: number;
    minTreasury?: number;
    maxTreasury?: number;
    minStability?: number;
    maxStability?: number;
    minUnrest?: number;
    minApproval?: number;
    maxApproval?: number;
    minInflation?: number;
    minUnemployment?: number;
    minDebt?: number;
    minArmyStrength?: number;
    maxArmyStrength?: number;
    minSecurity?: number;
    maxSecurity?: number;
    minGroupLoyalty?: Partial<Record<GroupId, number>>;
    maxGroupLoyalty?: Partial<Record<GroupId, number>>;
    minCountryRelation?: Record<string, number>;
    maxCountryRelation?: Record<string, number>;
    hasUpgrade?: string;
    notHasUpgrade?: string;
    difficulty?: Difficulty[];
  };
  choices: EventChoice[];
}

export interface EconomicState {
  treasury: number;
  taxRate: number; // 0..100 percent
  inflation: number; // percent
  unemployment: number; // percent
  growth: number; // annual percent
  debt: number;
  industry: number; // index
  agriculture: number; // index
  infrastructure: number; // index
  tradeBalance: number; // per-turn net trade
}

export interface MilitaryState {
  armyStrength: number; // 0..100
  defense: number; // 0..100
  security: number; // 0..100
  intelligence: number; // 0..100
  armyBudget: number; // per turn allocated
}

export interface ActiveEvent {
  uid: string;
  defId: string;
  turn: number;
}

export interface BuildingInstance {
  defId: string;
  daysLeft: number;
  completed: boolean;
}

export interface GameState {
  version: number;
  difficulty: Difficulty;
  turn: number; // days
  year: number;
  leaderName: string;
  countryName: string;
  flagColors: [string, string, string];
  stability: number; // 0..100
  approval: number; // 0..100
  unrest: number; // 0..100
  economy: EconomicState;
  military: MilitaryState;
  groups: Record<GroupId, Group>;
  countries: Record<string, Country>;
  buildings: BuildingInstance[];
  upgrades: string[]; // purchased upgrade ids
  activeEvents: ActiveEvent[];
  eventCooldowns: Record<string, number>; // defId -> turn available
  seenEvents: string[];
  log: LogEntry[];
  ending?: EndingId;
  victoryProgress: number; // 0..100 toward triumph
}

export interface LogEntry {
  turn: number;
  text: string;
  kind: 'event' | 'economy' | 'military' | 'diplomacy' | 'build' | 'turn' | 'ending';
}

export interface TurnReport {
  income: number;
  expenses: number;
  net: number;
  notes: string[];
  crisis?: string;
  ended?: EndingId;
}
