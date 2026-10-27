import type {
  Difficulty,
  EndingId,
  EventDef,
  EventChoice,
  GameState,
  GroupId,
  TurnReport,
  BuildingInstance,
} from './types';
import { GROUPS, GROUP_IDS } from './groups';
import { COUNTRIES } from './countries';
import { BUILDINGS, UPGRADES } from './buildings';
import { EVENTS } from './events';

const SAVE_KEY = 'iron_republic_save_v1';

export const DIFFICULTY_PARAMS: Record<Difficulty, {
  label: string;
  startingTreasury: number;
  unrestDrift: number;
  crisisThreshold: number;
  loyaltyDrift: number;
  eventChance: number;
}> = {
  easy: {
    label: 'Лёгкая',
    startingTreasury: 300,
    unrestDrift: -0.5,
    crisisThreshold: 95,
    loyaltyDrift: 0.3,
    eventChance: 0.7,
  },
  normal: {
    label: 'Обычная',
    startingTreasury: 200,
    unrestDrift: 0.2,
    crisisThreshold: 85,
    loyaltyDrift: 0,
    eventChance: 0.8,
  },
  hard: {
    label: 'Сложная',
    startingTreasury: 120,
    unrestDrift: 0.6,
    crisisThreshold: 75,
    loyaltyDrift: -0.3,
    eventChance: 0.9,
  },
};

export function createNewGame(difficulty: Difficulty): GameState {
  const params = DIFFICULTY_PARAMS[difficulty];
  const groups = {} as GameState['groups'];
  for (const id of GROUP_IDS) {
    groups[id] = { ...GROUPS[id] };
  }
  const countries = {} as GameState['countries'];
  for (const c of Object.values(COUNTRIES)) {
    countries[c.id] = { ...c };
  }
  return {
    version: 1,
    difficulty,
    turn: 1,
    year: 1,
    leaderName: 'Лидер',
    countryName: 'Республика',
    flagColors: ['#1d4ed8', '#ffffff', '#b91c1c'],
    stability: 60,
    approval: 55,
    unrest: 10,
    economy: {
      treasury: params.startingTreasury,
      taxRate: 25,
      inflation: 3,
      unemployment: 7,
      growth: 2,
      debt: 0,
      industry: 30,
      agriculture: 30,
      infrastructure: 25,
      tradeBalance: 5,
    },
    military: {
      armyStrength: 45,
      defense: 40,
      security: 50,
      intelligence: 30,
      armyBudget: 20,
    },
    groups,
    countries,
    buildings: [],
    upgrades: [],
    activeEvents: [],
    eventCooldowns: {},
    seenEvents: [],
    log: [{ turn: 1, kind: 'turn', text: 'Вы вступили в должность лидера Республики.' }],
    victoryProgress: 0,
  };
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function isEventEligible(def: EventDef, state: GameState): boolean {
  const c = def.conditions;
  if (!c) return true;
  if (c.minTurn !== undefined && state.turn < c.minTurn) return false;
  if (c.maxTurn !== undefined && state.turn > c.maxTurn) return false;
  if (c.minTreasury !== undefined && state.economy.treasury < c.minTreasury) return false;
  if (c.maxTreasury !== undefined && state.economy.treasury > c.maxTreasury) return false;
  if (c.minStability !== undefined && state.stability < c.minStability) return false;
  if (c.maxStability !== undefined && state.stability > c.maxStability) return false;
  if (c.minUnrest !== undefined && state.unrest < c.minUnrest) return false;
  if (c.minApproval !== undefined && state.approval < c.minApproval) return false;
  if (c.maxApproval !== undefined && state.approval > c.maxApproval) return false;
  if (c.minInflation !== undefined && state.economy.inflation < c.minInflation) return false;
  if (c.minUnemployment !== undefined && state.economy.unemployment < c.minUnemployment) return false;
  if (c.minDebt !== undefined && state.economy.debt < c.minDebt) return false;
  if (c.minArmyStrength !== undefined && state.military.armyStrength < c.minArmyStrength) return false;
  if (c.maxArmyStrength !== undefined && state.military.armyStrength > c.maxArmyStrength) return false;
  if (c.minSecurity !== undefined && state.military.security < c.minSecurity) return false;
  if (c.maxSecurity !== undefined && state.military.security > c.maxSecurity) return false;
  if (c.difficulty && !c.difficulty.includes(state.difficulty)) return false;
  if (c.hasUpgrade && !state.upgrades.includes(c.hasUpgrade)) return false;
  if (c.notHasUpgrade && state.upgrades.includes(c.notHasUpgrade)) return false;
  if (c.minGroupLoyalty) {
    for (const [gid, val] of Object.entries(c.minGroupLoyalty)) {
      if (state.groups[gid as GroupId].loyalty < val!) return false;
    }
  }
  if (c.maxGroupLoyalty) {
    for (const [gid, val] of Object.entries(c.maxGroupLoyalty)) {
      if (state.groups[gid as GroupId].loyalty > val!) return false;
    }
  }
  if (c.minCountryRelation) {
    for (const [cid, val] of Object.entries(c.minCountryRelation)) {
      if (state.countries[cid].relation < val!) return false;
    }
  }
  if (c.maxCountryRelation) {
    for (const [cid, val] of Object.entries(c.maxCountryRelation)) {
      if (state.countries[cid].relation > val!) return false;
    }
  }
  return true;
}

export function pickNextEvent(state: GameState): EventDef | null {
  const available = EVENTS.filter((def) => {
    if (def.oncePerGame && state.seenEvents.includes(def.id)) return false;
    const cooldownUntil = state.eventCooldowns[def.id] ?? 0;
    if (state.turn < cooldownUntil) return false;
    return isEventEligible(def, state);
  });
  if (available.length === 0) return null;
  const totalWeight = available.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * totalWeight;
  for (const def of available) {
    r -= def.weight;
    if (r <= 0) return def;
  }
  return available[available.length - 1];
}

export function applyChoice(state: GameState, def: EventDef, choice: EventChoice): {
  state: GameState;
  resultText: string;
  ended?: EndingId;
} {
  let next = deepClone(state);
  let eff = choice.effects;
  let text = choice.outcomeText;
  if (choice.successChance !== undefined && choice.successChance < 1) {
    if (Math.random() > choice.successChance && choice.failureEffects) {
      eff = choice.failureEffects;
      text = choice.failureText || choice.outcomeText;
    }
  }
  // The UI uses `cost` for affordability; effects handle the actual treasury change.
  // Avoid charging twice when effects.treasury already includes the cost.
  if (choice.cost && eff.treasury === undefined) {
    next.economy.treasury -= choice.cost;
  }
  next = applyEffects(next, eff);
  // record cooldown / seen
  next.eventCooldowns[def.id] = next.turn + def.cooldown;
  if (def.oncePerGame) next.seenEvents.push(def.id);
  // remove this active event
  next.activeEvents = next.activeEvents.filter((e) => e.defId !== def.id);
  // queue event?
  if (eff.queueEvent && EVENTS.find((e) => e.id === eff.queueEvent)) {
    next.activeEvents.push({ uid: `${eff.queueEvent}_${next.turn}`, defId: eff.queueEvent, turn: next.turn });
  }
  next.log.unshift({ turn: next.turn, kind: 'event', text: `${def.title}: ${text}` });
  if (next.log.length > 60) next.log = next.log.slice(0, 60);
  // explicit ending from the choice (e.g. stepping down)
  let ending: EndingId | undefined = eff.ending;
  if (!ending) ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.log.unshift({ turn: next.turn, kind: 'ending', text: endingText(ending) });
  }
  return { state: next, resultText: text, ended: next.ending };
}

export function applyEffects(state: GameState, eff: EventChoice['effects']): GameState {
  const s = state;
  if (eff.treasury !== undefined) s.economy.treasury += eff.treasury;
  if (eff.stability !== undefined) s.stability = clamp(s.stability + eff.stability);
  if (eff.approval !== undefined) s.approval = clamp(s.approval + eff.approval);
  if (eff.unrest !== undefined) s.unrest = clamp(s.unrest + eff.unrest);
  if (eff.inflation !== undefined) s.economy.inflation = Math.max(0, s.economy.inflation + eff.inflation);
  if (eff.unemployment !== undefined) s.economy.unemployment = clamp(s.economy.unemployment + eff.unemployment, 0, 100);
  if (eff.growth !== undefined) s.economy.growth = s.economy.growth + eff.growth;
  if (eff.debt !== undefined) s.economy.debt = Math.max(0, s.economy.debt + eff.debt);
  if (eff.industry !== undefined) s.economy.industry = clamp(s.economy.industry + eff.industry);
  if (eff.agriculture !== undefined) s.economy.agriculture = clamp(s.economy.agriculture + eff.agriculture);
  if (eff.infrastructure !== undefined) s.economy.infrastructure = clamp(s.economy.infrastructure + eff.infrastructure);
  if (eff.tradeBalance !== undefined) s.economy.tradeBalance += eff.tradeBalance;
  if (eff.armyStrength !== undefined) s.military.armyStrength = clamp(s.military.armyStrength + eff.armyStrength);
  if (eff.defense !== undefined) s.military.defense = clamp(s.military.defense + eff.defense);
  if (eff.security !== undefined) s.military.security = clamp(s.military.security + eff.security);
  if (eff.intelligence !== undefined) s.military.intelligence = clamp(s.military.intelligence + eff.intelligence);
  if (eff.groups) {
    for (const [gid, val] of Object.entries(eff.groups)) {
      s.groups[gid as GroupId].loyalty = clamp(s.groups[gid as GroupId].loyalty + val!);
    }
  }
  if (eff.relations) {
    for (const [cid, val] of Object.entries(eff.relations)) {
      if (s.countries[cid]) {
        s.countries[cid].relation = clamp(s.countries[cid].relation + val!, -100, 100);
      }
    }
  }
  return s;
}

export function processTurn(state: GameState): { state: GameState; report: TurnReport } {
  let s = deepClone(state);
  const params = DIFFICULTY_PARAMS[s.difficulty];
  const notes: string[] = [];
  const e = s.economy;
  const m = s.military;

  // Building progress
  let completedThisTurn: string[] = [];
  s.buildings = s.buildings.map((b) => {
    if (b.completed) return b;
    const nb = { ...b, daysLeft: b.daysLeft - 1 };
    if (nb.daysLeft <= 0) {
      nb.completed = true;
      const def = BUILDINGS.find((d) => d.id === b.defId);
      if (def) {
        completedThisTurn.push(def.name);
        if (def.category === 'industry') e.industry = clamp(e.industry + 4);
        if (def.category === 'agriculture') e.agriculture = clamp(e.agriculture + 4);
        if (def.category === 'infrastructure') e.infrastructure = clamp(e.infrastructure + 4);
        if (def.category === 'military') {
          m.defense = clamp(m.defense + 6);
          m.armyStrength = clamp(m.armyStrength + 3);
        }
        if (def.category === 'social') {
          s.stability = clamp(s.stability + 2);
        }
      }
    }
    return nb;
  });
  for (const name of completedThisTurn) {
    notes.push(`Завершено строительство: ${name}`);
  }

  // Income: tax base from industry + agriculture + trade, scaled by tax rate
  const taxBase = (e.industry + e.agriculture) * 0.6 + e.tradeBalance * 2;
  const taxIncome = Math.round((taxBase * e.taxRate) / 30);
  // Other income: completed buildings
  let buildingIncome = 0;
  let buildingUpkeep = 0;
  for (const b of s.buildings) {
    const def = BUILDINGS.find((d) => d.id === b.defId);
    if (!def) continue;
    if (b.completed) buildingIncome += def.income;
    else buildingUpkeep += Math.round(def.upkeep * 0.5);
    if (b.completed) buildingUpkeep += def.upkeep;
  }
  // Debt service
  const debtService = Math.round(e.debt * 0.04);
  // Military upkeep
  const militaryUpkeep = m.armyBudget;
  // Inflation drag on income
  const inflationFactor = Math.max(0.4, 1 - e.inflation / 25);
  const grossIncome = Math.round((taxIncome + buildingIncome + e.tradeBalance) * inflationFactor);
  const expenses = buildingUpkeep + militaryUpkeep + debtService + 15; // base admin cost
  const net = grossIncome - expenses;
  e.treasury += net;

  notes.push(`Доход: +${grossIncome}, Расход: -${expenses}, Чисто: ${net >= 0 ? '+' : ''}${net}`);

  // Inflation dynamics
  if (e.inflation > 5) e.growth -= 0.1;
  e.inflation = Math.max(0, e.inflation + (e.growth > 3 ? -0.2 : 0.1) + (Math.random() - 0.5) * 0.4);
  // Unemployment dynamics from growth & buildings
  const targetUnemp = Math.max(2, 8 - e.growth * 0.5 - s.buildings.filter((b) => b.completed).length * 0.3);
  e.unemployment = clamp(e.unemployment + (targetUnemp - e.unemployment) * 0.3 + (Math.random() - 0.5) * 0.5, 0, 100);
  // Growth drift toward infrastructure/industry
  const targetGrowth = (e.infrastructure + e.industry) / 30 - e.inflation / 10;
  e.growth = e.growth + (targetGrowth - e.growth) * 0.15;

  // Loyalty drift from difficulty + tax/budget
  for (const gid of GROUP_IDS) {
    let drift = params.loyaltyDrift;
    // group-specific reactions
    if (gid === 'workers' && e.unemployment > 10) drift -= 0.2;
    if (gid === 'workers' && e.inflation > 6) drift -= 0.2;
    if (gid === 'business' && e.taxRate > 35) drift -= 0.3;
    if (gid === 'business' && e.taxRate < 20) drift += 0.2;
    if (gid === 'farmers' && e.agriculture > 40) drift += 0.1;
    if (gid === 'military' && m.armyBudget < 15) drift -= 0.3;
    if (gid === 'military' && m.armyBudget > 30) drift += 0.2;
    if (gid === 'intelligentsia' && s.approval < 40) drift -= 0.2;
    if (gid === 'bureaucracy' && e.treasury < 0) drift -= 0.3;
    s.groups[gid].loyalty = clamp(s.groups[gid].loyalty + drift);
  }

  // Stability from loyalty average and unrest
  const avgLoyalty = GROUP_IDS.reduce((sum, id) => sum + s.groups[id].loyalty, 0) / GROUP_IDS.length;
  s.stability = clamp(s.stability + (avgLoyalty - s.stability) * 0.1 + (m.security - 50) * 0.02);
  // Approval drift toward stability - unrest
  s.approval = clamp(s.approval + (s.stability - s.unrest - s.approval) * 0.1);
  // Unrest drift
  s.unrest = clamp(s.unrest + params.unrestDrift + (e.unemployment - 7) * 0.1 + (e.inflation - 3) * 0.15);

  // Country relations drift toward 0
  for (const c of Object.values(s.countries)) {
    c.relation += (0 - c.relation) * 0.02;
    c.relation = clamp(c.relation, -100, 100);
  }

  // Victory progress: high stability & approval & economy
  if (s.stability > 70 && s.approval > 60 && e.treasury > 100 && s.unrest < 30) {
    s.victoryProgress = clamp(s.victoryProgress + 2);
  } else {
    s.victoryProgress = clamp(s.victoryProgress - 0.5);
  }

  s.turn += 1;
  if (s.turn % 12 === 0) s.year += 1;

  // Maybe trigger a new event
  if (Math.random() < params.eventChance && s.activeEvents.length < 3) {
    const def = pickNextEvent(s);
    if (def) {
      s.activeEvents.push({ uid: `${def.id}_${s.turn}`, defId: def.id, turn: s.turn });
      notes.push(`Новое событие: ${def.title}`);
    }
  }

  s.log.unshift({ turn: s.turn, kind: 'turn', text: `Ход ${s.turn}. Доход ${grossIncome}, расход ${expenses}.` });
  if (s.log.length > 60) s.log = s.log.slice(0, 60);

  const report: TurnReport = { income: grossIncome, expenses, net, notes };

  const ending = checkEnding(s);
  if (ending) {
    s.ending = ending;
    report.ended = ending;
    report.crisis = endingText(ending);
    s.log.unshift({ turn: s.turn, kind: 'ending', text: endingText(ending) });
  }

  return { state: s, report };
}

export function checkEnding(s: GameState): EndingId | undefined {
  if (s.victoryProgress >= 100) return 'triumph';
  if (s.unrest >= 95) return 'revolution';
  if (s.groups.military.loyalty <= 10 && s.military.armyStrength > 50) return 'coup';
  if (s.economy.treasury < -150) return 'bankruptcy';
  if (s.stability <= 5) return 'collapse';
  // external overthrow if multiple hostile countries and weak army
  const hostileCount = Object.values(s.countries).filter((c) => c.relation < -50).length;
  if (hostileCount >= 3 && s.military.armyStrength < 30 && s.military.defense < 30) return 'overthrow_external';
  return undefined;
}

export function endingText(id: EndingId): string {
  switch (id) {
    case 'triumph':
      return 'ТРИУМФ! Вы привели Республику к золотому веку. Народ благословляет ваше имя.';
    case 'revolution':
      return 'РЕВОЛЮЦИЯ. Народ восстал и сверг режим. Власть утрачена.';
    case 'coup':
      return 'ВОЕННЫЙ ПЕРЕВОРОТ. Армия сместила вас. Республика пала под гусарами сабель.';
    case 'bankruptcy':
      return 'БАНКРОТСТВО. Казна пуста, долги непомерны. Государство рухнуло.';
    case 'collapse':
      return 'РАСПАД. Стабильность упала до нуля. Страна распалась на уделы.';
    case 'overthrow_external':
      return 'ВНЕШНЕЕ СВЕРЖЕНИЕ. Враждебные державы объединились и устранили вас.';
  }
}

export function buildBuilding(state: GameState, defId: string): { state: GameState; ok: boolean; reason?: string } {
  const def = BUILDINGS.find((b) => b.id === defId);
  if (!def) return { state, ok: false, reason: 'Нет такого здания' };
  if (def.requires && !state.upgrades.includes(def.requires)) {
    return { state, ok: false, reason: 'Требуется предварительное улучшение' };
  }
  if (state.economy.treasury < def.cost) return { state, ok: false, reason: 'Недостаточно средств' };
  const s = deepClone(state);
  s.economy.treasury -= def.cost;
  s.buildings.push({ defId, daysLeft: def.daysToBuild, completed: false });
  s.log.unshift({ turn: s.turn, kind: 'build', text: `Начато строительство: ${def.name}` });
  if (s.log.length > 60) s.log = s.log.slice(0, 60);
  return { state: s, ok: true };
}

export function purchaseUpgrade(state: GameState, upId: string): { state: GameState; ok: boolean; reason?: string } {
  const def = UPGRADES.find((u) => u.id === upId);
  if (!def) return { state, ok: false, reason: 'Нет такого улучшения' };
  if (state.upgrades.includes(upId)) return { state, ok: false, reason: 'Уже куплено' };
  if (def.requires && !state.upgrades.includes(def.requires)) {
    return { state, ok: false, reason: 'Требуется предыдущее улучшение' };
  }
  if (state.economy.treasury < def.cost) return { state, ok: false, reason: 'Недостаточно средств' };
  const s = deepClone(state);
  s.economy.treasury -= def.cost;
  s.upgrades.push(upId);
  // apply permanent effects
  if (def.effect.industry) s.economy.industry = clamp(s.economy.industry + def.effect.industry);
  if (def.effect.agriculture) s.economy.agriculture = clamp(s.economy.agriculture + def.effect.agriculture);
  if (def.effect.infrastructure) s.economy.infrastructure = clamp(s.economy.infrastructure + def.effect.infrastructure);
  if (def.effect.tradeBalance) s.economy.tradeBalance += def.effect.tradeBalance;
  if (def.effect.growth) s.economy.growth += def.effect.growth;
  if (def.effect.groupDeltas) {
    for (const [gid, val] of Object.entries(def.effect.groupDeltas)) {
      s.groups[gid as GroupId].loyalty = clamp(s.groups[gid as GroupId].loyalty + val!);
    }
  }
  // military upgrades apply to military state
  if (upId === 'upgrade_army_1') s.military.armyStrength = clamp(s.military.armyStrength + 10);
  if (upId === 'upgrade_army_2') s.military.armyStrength = clamp(s.military.armyStrength + 15);
  if (upId === 'upgrade_intel_1') { s.military.intelligence = clamp(s.military.intelligence + 15); s.military.security = clamp(s.military.security + 5); }
  if (upId === 'upgrade_intel_2') s.military.security = clamp(s.military.security + 15);
  if (upId === 'upgrade_civic_secret_police') s.military.security = clamp(s.military.security + 10);
  s.log.unshift({ turn: s.turn, kind: 'build', text: `Реализовано: ${def.name}` });
  if (s.log.length > 60) s.log = s.log.slice(0, 60);
  return { state: s, ok: true };
}

export function setTaxRate(state: GameState, rate: number): GameState {
  const s = deepClone(state);
  s.economy.taxRate = clamp(Math.round(rate), 0, 60);
  return s;
}

export function setArmyBudget(state: GameState, budget: number): GameState {
  const s = deepClone(state);
  s.military.armyBudget = clamp(Math.round(budget), 0, 60);
  return s;
}

export function diplomaticAction(state: GameState, countryId: string, action: 'trade' | 'sanctions' | 'aid' | 'improve'): {
  state: GameState;
  ok: boolean;
  reason?: string;
} {
  const s = deepClone(state);
  const c = s.countries[countryId];
  if (!c) return { state, ok: false, reason: 'Нет такой страны' };
  switch (action) {
    case 'trade':
      if (s.economy.treasury < 20) return { state, ok: false, reason: 'Недостаточно средств' };
      s.economy.treasury -= 20;
      s.economy.tradeBalance += 3;
      c.relation = clamp(c.relation + 8, -100, 100);
      s.log.unshift({ turn: s.turn, kind: 'diplomacy', text: `Торговое соглашение с ${c.name}. Отношения +8.` });
      break;
    case 'sanctions':
      c.relation = clamp(c.relation - 15, -100, 100);
      s.economy.tradeBalance -= 2;
      s.log.unshift({ turn: s.turn, kind: 'diplomacy', text: `Санкции против ${c.name}. Отношения -15.` });
      break;
    case 'aid':
      if (s.economy.treasury < 40) return { state, ok: false, reason: 'Недостаточно средств' };
      s.economy.treasury -= 40;
      c.relation = clamp(c.relation + 15, -100, 100);
      s.log.unshift({ turn: s.turn, kind: 'diplomacy', text: `Помощь ${c.name}. Отношения +15.` });
      break;
    case 'improve':
      if (s.economy.treasury < 15) return { state, ok: false, reason: 'Недостаточно средств' };
      s.economy.treasury -= 15;
      c.relation = clamp(c.relation + 6, -100, 100);
      s.log.unshift({ turn: s.turn, kind: 'diplomacy', text: `Дипломатические усилия: ${c.name}. Отношения +6.` });
      break;
  }
  if (s.log.length > 60) s.log = s.log.slice(0, 60);
  return { state: s, ok: true };
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// ===== Storage =====
export async function saveGame(state: GameState): Promise<void> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // web fallback
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {}
  }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.default.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (e) {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  }
}

export async function clearSave(): Promise<void> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem(SAVE_KEY);
  } catch (e) {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
  }
}

export async function hasSave(): Promise<boolean> {
  const s = await loadGame();
  return s !== null && !s.ending;
}

export function summarizeSave(state: GameState): string {
  return `Год ${state.year}, ход ${state.turn} · Казна ${Math.round(state.economy.treasury)} · Стаб. ${Math.round(state.stability)}`;
}
