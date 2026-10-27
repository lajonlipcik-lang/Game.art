import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Difficulty, EndingId, EventChoice, EventDef, GameState } from '@/game/types';
import {
  createNewGame,
  processTurn,
  applyChoice,
  buildBuilding,
  purchaseUpgrade,
  setTaxRate,
  setArmyBudget,
  diplomaticAction,
  saveGame,
  loadGame,
  clearSave,
} from '@/game/engine';

interface GameContextValue {
  state: GameState | null;
  lastChoiceResult: string | null;
  lastTurnReport: string | null;
  loading: boolean;
  hasExistingSave: boolean;
  startNewGame: (difficulty: Difficulty) => void;
  continueGame: () => void;
  resetSave: () => void;
  advanceTurn: () => void;
  resolveEvent: (def: EventDef, choice: EventChoice) => void;
  construct: (defId: string) => boolean;
  research: (upId: string) => boolean;
  changeTaxRate: (rate: number) => void;
  changeArmyBudget: (budget: number) => void;
  diplomacy: (countryId: string, action: 'trade' | 'sanctions' | 'aid' | 'improve') => boolean;
  dismissResult: () => void;
  ending: EndingId | null;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingSave, setHasExistingSave] = useState(false);
  const [lastChoiceResult, setLastChoiceResult] = useState<string | null>(null);
  const [lastTurnReport, setLastTurnReport] = useState<string | null>(null);
  const [ending, setEnding] = useState<EndingId | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await loadGame();
      setHasExistingSave(existing !== null && !existing.ending);
      setLoading(false);
    })();
  }, []);

  // Auto-save (debounced) whenever state changes and game is active
  useEffect(() => {
    if (!state) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveGame(state).catch(() => {});
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    const s = createNewGame(difficulty);
    setState(s);
    setEnding(null);
    setHasExistingSave(true);
    saveGame(s).catch(() => {});
  }, []);

  const continueGame = useCallback(async () => {
    const existing = await loadGame();
    if (existing) {
      setState(existing);
      setEnding(existing.ending ?? null);
    }
  }, []);

  const resetSave = useCallback(async () => {
    await clearSave();
    setState(null);
    setEnding(null);
    setHasExistingSave(false);
    setLastChoiceResult(null);
    setLastTurnReport(null);
  }, []);

  const advanceTurn = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.ending) return prev;
      const { state: next, report } = processTurn(prev);
      const reportText = report.notes.join('\n');
      setLastTurnReport(reportText);
      if (report.ended) {
        setEnding(report.ended);
        saveGame(next).catch(() => {});
      }
      return next;
    });
  }, []);

  const resolveEvent = useCallback((def: EventDef, choice: EventChoice) => {
    setState((prev) => {
      if (!prev) return prev;
      const { state: next, resultText } = applyChoice(prev, def, choice);
      setLastChoiceResult(resultText);
      if (next.ending) {
        setEnding(next.ending);
        saveGame(next).catch(() => {});
      }
      return next;
    });
  }, []);

  const construct = useCallback((defId: string): boolean => {
    let ok = false;
    setState((prev) => {
      if (!prev) return prev;
      const res = buildBuilding(prev, defId);
      if (!res.ok) {
        setLastChoiceResult(res.reason || 'Невозможно построить');
      }
      ok = res.ok;
      return res.state;
    });
    return ok;
  }, []);

  const research = useCallback((upId: string): boolean => {
    let ok = false;
    setState((prev) => {
      if (!prev) return prev;
      const res = purchaseUpgrade(prev, upId);
      if (!res.ok) {
        setLastChoiceResult(res.reason || 'Невозможно исследовать');
      }
      ok = res.ok;
      return res.state;
    });
    return ok;
  }, []);

  const changeTaxRate = useCallback((rate: number) => {
    setState((prev) => (prev ? setTaxRate(prev, rate) : prev));
  }, []);

  const changeArmyBudget = useCallback((budget: number) => {
    setState((prev) => (prev ? setArmyBudget(prev, budget) : prev));
  }, []);

  const diplomacy = useCallback(
    (countryId: string, action: 'trade' | 'sanctions' | 'aid' | 'improve'): boolean => {
      let ok = false;
      setState((prev) => {
        if (!prev) return prev;
        const res = diplomaticAction(prev, countryId, action);
        if (!res.ok) {
          setLastChoiceResult(res.reason || 'Невозможно');
        } else {
          setLastChoiceResult('Дипломатическое действие выполнено');
        }
        ok = res.ok;
        return res.state;
      });
      return ok;
    },
    [],
  );

  const dismissResult = useCallback(() => {
    setLastChoiceResult(null);
    setLastTurnReport(null);
  }, []);

  // Sync ending flag with state
  useEffect(() => {
    if (state?.ending) setEnding(state.ending);
  }, [state]);

  const value: GameContextValue = {
    state,
    lastChoiceResult,
    lastTurnReport,
    loading,
    hasExistingSave,
    startNewGame,
    continueGame,
    resetSave,
    advanceTurn,
    resolveEvent,
    construct,
    research,
    changeTaxRate,
    changeArmyBudget,
    diplomacy,
    dismissResult,
    ending,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
