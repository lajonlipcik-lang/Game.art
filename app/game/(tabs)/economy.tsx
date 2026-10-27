import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { Bar, Card, PrimaryButton, GhostButton, SectionTitle, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BUILDINGS, UPGRADES } from '@/game/buildings';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function EconomyTab() {
  const { state, construct, research, changeTaxRate } = useGame();
  const [tab, setTab] = useState<'overview' | 'build' | 'research'>('overview');

  if (!state) {
    return <SafeAreaView style={styles.screen} edges={['top']}><EmptyState title="Нет активной игры" /></SafeAreaView>;
  }

  const e = state.economy;

  const completed = state.buildings.filter((b) => b.completed);
  const inProgress = state.buildings.filter((b) => !b.completed);
  const totalBuildingIncome = completed.reduce((s, b) => {
    const d = BUILDINGS.find((x) => x.id === b.defId);
    return s + (d?.income || 0);
  }, 0);
  const totalUpkeep = state.buildings.reduce((s, b) => {
    const d = BUILDINGS.find((x) => x.id === b.defId);
    return s + (d?.upkeep || 0);
  }, 0);

  const canBuild = (defId: string) => {
    const d = BUILDINGS.find((b) => b.id === defId);
    if (!d) return false;
    if (d.requires && !state.upgrades.includes(d.requires)) return false;
    return e.treasury >= d.cost;
  };

  const canResearch = (upId: string) => {
    const d = UPGRADES.find((u) => u.id === upId);
    if (!d) return false;
    if (state.upgrades.includes(upId)) return false;
    if (d.requires && !state.upgrades.includes(d.requires)) return false;
    return e.treasury >= d.cost;
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.tabBar}>
        {(['overview', 'build', 'research'] as const).map((t) => (
          <TabBtn key={t} label={t === 'overview' ? 'Обзор' : t === 'build' ? 'Стройка' : 'Реформы'} active={tab === t} onPress={() => { haptic(); setTab(t); }} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <>
            <Card style={styles.card}>
              <View style={styles.treasuryBlock}>
                <View>
                  <Text style={TYPO.micro}>Казна</Text>
                  <Text style={styles.treasuryVal}>{Math.round(e.treasury)}</Text>
                </View>
                <View style={styles.treasurySide}>
                  <View style={styles.trRow}><Icon name="TrendingUp" size={14} color={COLORS.success} /><Text style={styles.trText}>Доходы зданий: +{totalBuildingIncome}</Text></View>
                  <View style={styles.trRow}><Icon name="TrendingDown" size={14} color={COLORS.danger} /><Text style={styles.trText}>Обслуживание: −{totalUpkeep}</Text></View>
                  <View style={styles.trRow}><Icon name="Coins" size={14} color={COLORS.accent} /><Text style={styles.trText}>Торговля: {e.tradeBalance >= 0 ? '+' : ''}{e.tradeBalance}</Text></View>
                </View>
              </View>
            </Card>

            <SectionTitle>Налоговая ставка</SectionTitle>
            <Card>
              <View style={styles.taxRow}>
                <Text style={TYPO.h3}>{e.taxRate}%</Text>
                <Text style={TYPO.small}>Высокие налоги давят на бизнес и рост</Text>
              </View>
              <View style={styles.taxControls}>
                <GhostButton label="−5%" onPress={() => { haptic(); changeTaxRate(e.taxRate - 5); }} color={COLORS.danger} />
                <GhostButton label="−1%" onPress={() => { haptic(); changeTaxRate(e.taxRate - 1); }} />
                <GhostButton label="+1%" onPress={() => { haptic(); changeTaxRate(e.taxRate + 1); }} />
                <GhostButton label="+5%" onPress={() => { haptic(); changeTaxRate(e.taxRate + 5); }} color={COLORS.success} />
              </View>
            </Card>

            <SectionTitle>Экономические показатели</SectionTitle>
            <Card style={{ gap: SIZES.s }}>
              <Indicator label="Промышленность" value={e.industry} icon="Factory" />
              <Indicator label="Сельское хозяйство" value={e.agriculture} icon="Wheat" />
              <Indicator label="Инфраструктура" value={e.infrastructure} icon="Route" />
              <Indicator label="Инфляция" value={Math.min(100, e.inflation * 5)} displayValue={`${e.inflation.toFixed(1)}%`} icon="TrendingUp" color={e.inflation > 7 ? COLORS.danger : e.inflation > 4 ? COLORS.warning : COLORS.success} />
              <Indicator label="Безработица" value={e.unemployment} displayValue={`${e.unemployment.toFixed(1)}%`} icon="Users" color={e.unemployment > 12 ? COLORS.danger : e.unemployment > 8 ? COLORS.warning : COLORS.success} />
              <Indicator label="Экономический рост" value={Math.max(0, e.growth * 10)} displayValue={`${e.growth.toFixed(1)}%`} icon="TrendingUp" color={e.growth > 3 ? COLORS.success : e.growth > 0 ? COLORS.warning : COLORS.danger} />
              <Indicator label="Государственный долг" value={Math.min(100, e.debt / 5)} displayValue={`${Math.round(e.debt)}`} icon="Banknote" color={e.debt > 200 ? COLORS.danger : e.debt > 80 ? COLORS.warning : COLORS.success} />
            </Card>

            <SectionTitle>Построенные объекты ({completed.length})</SectionTitle>
            {completed.length === 0 ? (
              <Card><Text style={TYPO.small}>Пока ничего не построено.</Text></Card>
            ) : (
              <View style={{ gap: SIZES.s }}>
                {completed.map((b, i) => {
                  const d = BUILDINGS.find((x) => x.id === b.defId);
                  if (!d) return null;
                  return (
                    <Card key={i} style={styles.builtRow}>
                      <Icon name={d.icon} size={20} color={COLORS.accent} />
                      <View style={{ flex: 1, marginLeft: SIZES.s }}>
                        <Text style={TYPO.body}>{d.name}</Text>
                        <Text style={TYPO.small}>+{d.income} доход · −{d.upkeep} обслуж.</Text>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            {inProgress.length > 0 ? (
              <>
                <SectionTitle>В строительстве</SectionTitle>
                <View style={{ gap: SIZES.s }}>
                  {inProgress.map((b, i) => {
                    const d = BUILDINGS.find((x) => x.id === b.defId);
                    if (!d) return null;
                    return (
                      <Card key={i}>
                        <View style={styles.builtRow}>
                          <Icon name={d.icon} size={20} color={COLORS.info} />
                          <View style={{ flex: 1, marginLeft: SIZES.s }}>
                            <Text style={TYPO.body}>{d.name}</Text>
                            <Text style={TYPO.small}>Осталось ходов: {b.daysLeft}</Text>
                          </View>
                        </View>
                        <Bar value={d.daysToBuild - b.daysLeft} max={d.daysToBuild} color={COLORS.info} />
                      </Card>
                    );
                  })}
                </View>
              </>
            ) : null}
          </>
        )}

        {tab === 'build' && (
          <>
            <SectionTitle>Доступные здания</SectionTitle>
            <Text style={TYPO.small}>Казна: {Math.round(e.treasury)}</Text>
            <View style={{ height: SIZES.s }} />
            <View style={{ gap: SIZES.s }}>
              {BUILDINGS.map((d) => {
                const ok = canBuild(d.id);
                const locked = d.requires && !state.upgrades.includes(d.requires);
                return (
                  <Card key={d.id} style={!ok ? { opacity: 0.7 } : {}}>
                    <View style={styles.builtRow}>
                      <Icon name={d.icon} size={22} color={d.category === 'military' ? COLORS.primary : COLORS.accent} />
                      <View style={{ flex: 1, marginLeft: SIZES.s }}>
                        <Text style={TYPO.h3}>{d.name}</Text>
                        <Text style={TYPO.small}>{d.description}</Text>
                        <Text style={styles.metaLine}>Стоимость: {d.cost} · Срок: {d.daysToBuild} ход · Доход: +{d.income} · Обслуж.: −{d.upkeep}</Text>
                        {locked ? <Text style={styles.lockedText}>Требуется улучшение</Text> : null}
                      </View>
                    </View>
                    <PrimaryButton label={ok ? 'Построить' : locked ? 'Заблокировано' : 'Недостаточно средств'} onPress={() => { haptic(); construct(d.id); }} disabled={!ok} color={d.category === 'military' ? COLORS.primary : COLORS.accent} />
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {tab === 'research' && (
          <>
            <SectionTitle>Реформы и развитие</SectionTitle>
            <Text style={TYPO.small}>Казна: {Math.round(e.treasury)}</Text>
            <View style={{ height: SIZES.s }} />
            {(['economy', 'military', 'social', 'civic'] as const).map((branch) => (
              <View key={branch} style={{ marginBottom: SIZES.m }}>
                <Text style={TYPO.h3}>{branchLabel(branch)}</Text>
                <View style={{ height: SIZES.s }} />
                <View style={{ gap: SIZES.s }}>
                  {UPGRADES.filter((u) => u.branch === branch).map((u) => {
                    const owned = state.upgrades.includes(u.id);
                    const ok = canResearch(u.id);
                    const locked = u.requires && !state.upgrades.includes(u.requires);
                    return (
                      <Card key={u.id} style={owned ? { opacity: 0.5 } : !ok ? { opacity: 0.7 } : {}}>
                        <View style={styles.builtRow}>
                          <Icon name={u.icon} size={20} color={COLORS.info} />
                          <View style={{ flex: 1, marginLeft: SIZES.s }}>
                            <Text style={TYPO.h3}>{u.name}</Text>
                            <Text style={TYPO.small}>{u.description}</Text>
                            <Text style={styles.metaLine}>Стоимость: {u.cost}</Text>
                            {locked ? <Text style={styles.lockedText}>Требуется предыдущее улучшение</Text> : null}
                            {owned ? <Text style={[styles.lockedText, { color: COLORS.success }]}>Реализовано</Text> : null}
                          </View>
                        </View>
                        {!owned ? (
                          <PrimaryButton label={ok ? 'Реализовать' : locked ? 'Заблокировано' : 'Недостаточно средств'} onPress={() => { haptic(); research(u.id); }} disabled={!ok} color={COLORS.info} />
                        ) : null}
                      </Card>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Indicator({ label, value, displayValue, icon, color = COLORS.primary }: { label: string; value: number; displayValue?: string; icon: string; color?: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={16} color={COLORS.textDim} />
          <Text style={TYPO.body}>{label}</Text>
        </View>
        <Text style={[TYPO.body, { fontWeight: '700', color }]}>{displayValue || Math.round(value)}</Text>
      </View>
      <Bar value={value} color={color} />
    </View>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnLabel, active && styles.tabBtnLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function branchLabel(b: string): string {
  switch (b) {
    case 'economy': return 'Экономика';
    case 'military': return 'Военные';
    case 'social': return 'Социальные';
    case 'civic': return 'Государственные';
    default: return b;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.bgElev, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabBtnLabel: { fontSize: 13, color: COLORS.textMute, fontWeight: '600' },
  tabBtnLabelActive: { color: COLORS.accent },
  card: { gap: SIZES.s },
  treasuryBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  treasuryVal: { fontSize: 30, fontWeight: '700', color: COLORS.accent },
  treasurySide: { gap: 4, alignItems: 'flex-end' },
  trRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trText: { fontSize: 12, color: COLORS.textDim },
  taxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.s },
  taxControls: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  builtRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.s },
  metaLine: { fontSize: 11, color: COLORS.textMute, marginTop: 4 },
  lockedText: { fontSize: 11, color: COLORS.danger, marginTop: 4, fontWeight: '600' },
});
