import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { Bar, Card, PrimaryButton, SectionTitle, EmptyState } from '@/components/ui';
import { Flag, LeaderPortrait } from '@/components/emblems';
import { Icon } from '@/components/Icon';
import { EVENT_MAP } from '@/game/events';
import { GROUP_IDS } from '@/game/groups';
import * as Haptics from 'expo-haptics';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function colorForValue(v: number, good = 50, bad = 30): string {
  if (v >= good) return COLORS.success;
  if (v < bad) return COLORS.danger;
  return COLORS.warning;
}

export default function OverviewTab() {
  const router = useRouter();
  const { state, advanceTurn, resolveEvent, lastChoiceResult, lastTurnReport, dismissResult, ending } = useGame();
  const [activeEventUid, setActiveEventUid] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (ending) {
        router.replace('/ending');
      }
    }, [ending]),
  );

  if (!state) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <EmptyState title="Нет активной игры" subtitle="Вернитесь в меню и начните новую." />
      </SafeAreaView>
    );
  }

  const e = state.economy;
  const activeDef = state.activeEvents.find((ev) => ev.uid === activeEventUid);
  const firstEvent = state.activeEvents[0];

  const handleTurn = () => {
    haptic();
    dismissResult();
    advanceTurn();
  };

  const openEvent = (uid: string) => {
    haptic();
    setActiveEventUid(uid);
  };

  const handleChoice = (choiceIndex: number) => {
    if (!activeDef) return;
    const def = EVENT_MAP[activeDef.defId];
    if (!def) return;
    haptic();
    resolveEvent(def, def.choices[choiceIndex]);
    setActiveEventUid(null);
  };

  const avgLoyalty = Math.round(GROUP_IDS.reduce((s, id) => s + state.groups[id].loyalty, 0) / GROUP_IDS.length);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
        {/* State header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Flag colors={state.flagColors} size={48} />
            <View style={{ flex: 1, marginLeft: SIZES.m }}>
              <Text style={TYPO.h2}>{state.countryName}</Text>
              <Text style={TYPO.small}>Год {state.year} · Ход {state.turn} · {state.difficulty === 'easy' ? 'Лёгкая' : state.difficulty === 'normal' ? 'Обычная' : 'Сложная'}</Text>
            </View>
            <LeaderPortrait size={48} />
          </View>

          <View style={styles.treasuryRow}>
            <Icon name="Coins" size={20} color={COLORS.accent} />
            <Text style={styles.treasuryValue}>{Math.round(e.treasury)}</Text>
            <Text style={styles.treasuryUnit}>казна</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Стабильность</Text>
              <Bar value={state.stability} color={colorForValue(state.stability, 60, 25)} />
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Поддержка</Text>
              <Bar value={state.approval} color={colorForValue(state.approval, 55, 30)} />
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Недовольство</Text>
              <Bar value={state.unrest} color={state.unrest > 60 ? COLORS.danger : state.unrest > 35 ? COLORS.warning : COLORS.success} />
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Власть</Text>
              <Bar value={state.victoryProgress} color={COLORS.accent} />
            </View>
          </View>

          <View style={styles.miniRow}>
            <View style={styles.miniCell}><Text style={styles.miniLabel}>Инфл.</Text><Text style={styles.miniVal}>{e.inflation.toFixed(1)}%</Text></View>
            <View style={styles.miniCell}><Text style={styles.miniLabel}>Безраб.</Text><Text style={styles.miniVal}>{e.unemployment.toFixed(1)}%</Text></View>
            <View style={styles.miniCell}><Text style={styles.miniLabel}>Рост</Text><Text style={styles.miniVal}>{e.growth.toFixed(1)}%</Text></View>
            <View style={styles.miniCell}><Text style={styles.miniLabel}>Долг</Text><Text style={styles.miniVal}>{Math.round(e.debt)}</Text></View>
          </View>
        </Card>

        {/* Active events */}
        <SectionTitle>События {state.activeEvents.length > 0 ? `(${state.activeEvents.length})` : ''}</SectionTitle>
        {state.activeEvents.length === 0 ? (
          <Card style={{ opacity: 0.7 }}>
            <Text style={TYPO.small}>Срочных событий нет. Можете перевести ход.</Text>
          </Card>
        ) : (
          <View style={{ gap: SIZES.s }}>
            {state.activeEvents.map((ev) => {
              const def = EVENT_MAP[ev.defId];
              if (!def) return null;
              return (
                <TouchableOpacity key={ev.uid} activeOpacity={0.85} onPress={() => openEvent(ev.uid)}>
                  <Card style={styles.eventCard}>
                    <View style={styles.eventRow}>
                      <View style={[styles.eventIcon, { backgroundColor: def.category === 'crisis' ? COLORS.danger : def.category === 'military' ? COLORS.primary : COLORS.accent }]}>
                        <Icon name={def.icon} size={20} color="#fff" />
                      </View>
                      <View style={{ flex: 1, marginLeft: SIZES.s }}>
                        <Text style={TYPO.h3} numberOfLines={1}>{def.title}</Text>
                        <Text style={TYPO.small} numberOfLines={2}>{def.body}</Text>
                      </View>
                      <Icon name="ChevronRight" size={20} color={COLORS.textMute} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Next turn */}
        <View style={{ height: SIZES.m }} />
        <PrimaryButton label="Перевести ход →" onPress={handleTurn} color={COLORS.success} icon={<Icon name="ArrowRight" size={18} color="#fff" />} />

        <View style={{ height: SIZES.m }} />
        <Card style={{ opacity: 0.85 }}>
          <Text style={TYPO.small}>Лояльность групп (средняя): {avgLoyalty}</Text>
          <View style={styles.loyaltyMiniRow}>
            {GROUP_IDS.map((gid) => (
              <View key={gid} style={styles.loyaltyMiniCell}>
                <Icon name={state.groups[gid].icon} size={14} color={state.groups[gid].color} />
                <Text style={styles.loyaltyMiniVal}>{Math.round(state.groups[gid].loyalty)}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Event resolution modal */}
      <Modal visible={!!activeDef} transparent animationType="slide" onRequestClose={() => setActiveEventUid(null)}>
        {activeDef && EVENT_MAP[activeDef.defId] ? (
          <EventModal
            def={EVENT_MAP[activeDef.defId]}
            onChoose={handleChoice}
            onClose={() => setActiveEventUid(null)}
            treasury={state.economy.treasury}
          />
        ) : <View />}
      </Modal>

      {/* Result toast */}
      <Modal visible={!!lastChoiceResult || !!lastTurnReport} transparent animationType="fade" onRequestClose={dismissResult}>
        <ResultModal text={lastChoiceResult || lastTurnReport || ''} onClose={dismissResult} />
      </Modal>
    </SafeAreaView>
  );
}

function EventModal({ def, onChoose, onClose, treasury }: { def: any; onChoose: (i: number) => void; onClose: () => void; treasury: number }) {
  return (
    <View style={styles.modalBg}>
      <ScrollView contentContainerStyle={{ padding: SIZES.l }} showsVerticalScrollIndicator={false}>
        <Card style={styles.eventModalCard}>
          <View style={styles.eventModalHeader}>
            <View style={[styles.eventIconLg, { backgroundColor: def.category === 'crisis' ? COLORS.danger : def.category === 'military' ? COLORS.primary : COLORS.accent }]}>
              <Icon name={def.icon} size={28} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: SIZES.m }}>
              <Text style={TYPO.h2}>{def.title}</Text>
              <Text style={TYPO.micro}>{categoryLabel(def.category)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Icon name="X" size={22} color={COLORS.textDim} />
            </TouchableOpacity>
          </View>

          <Text style={[TYPO.body, { marginVertical: SIZES.m }]}>{def.body}</Text>

          <View style={{ gap: SIZES.s }}>
            {def.choices.map((c: any, i: number) => {
              const affordable = !c.cost || treasury >= c.cost;
              return (
                <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => affordable && onChoose(i)} disabled={!affordable}>
                  <Card style={[styles.choiceCard, !affordable && { opacity: 0.5 }]}>
                    <View style={styles.choiceHeader}>
                      <Text style={TYPO.h3}>{c.label}</Text>
                      {c.cost ? <Text style={[styles.costTag, { color: affordable ? COLORS.accent : COLORS.danger }]}>−{c.cost}</Text> : null}
                    </View>
                    <Text style={TYPO.small}>{c.description}</Text>
                    {c.successChance !== undefined && c.successChance < 1 ? (
                      <Text style={[styles.chanceTag, { color: COLORS.warning }]}>Шанс успеха: {Math.round(c.successChance * 100)}%</Text>
                    ) : null}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function ResultModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <View style={styles.resultBg}>
      <Card style={styles.resultCard}>
        <Text style={TYPO.body}>{text}</Text>
        <PrimaryButton label="Понятно" onPress={onClose} />
      </Card>
    </View>
  );
}

function categoryLabel(c: string): string {
  switch (c) {
    case 'economy': return 'Экономика';
    case 'politics': return 'Политика';
    case 'military': return 'Армия и безопасность';
    case 'diplomacy': return 'Дипломатия';
    case 'social': return 'Социальная сфера';
    case 'crisis': return 'Кризис';
    default: return c;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  headerCard: { gap: SIZES.m },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  treasuryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: SIZES.s },
  treasuryValue: { fontSize: 32, fontWeight: '700', color: COLORS.accent },
  treasuryUnit: { fontSize: 12, color: COLORS.textDim, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.s },
  statCell: { width: '48%', gap: 4 },
  statLabel: { fontSize: 10, color: COLORS.textMute, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniRow: { flexDirection: 'row', gap: SIZES.s, marginTop: SIZES.s },
  miniCell: { flex: 1, backgroundColor: COLORS.cardElev, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
  miniLabel: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase' },
  miniVal: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  eventCard: { padding: SIZES.s + 2 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  loyaltyMiniRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SIZES.s },
  loyaltyMiniCell: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.cardElev, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  loyaltyMiniVal: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  eventModalCard: { gap: SIZES.s },
  eventModalHeader: { flexDirection: 'row', alignItems: 'center' },
  eventIconLg: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choiceCard: { backgroundColor: COLORS.cardElev, padding: SIZES.s + 4 },
  choiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  costTag: { fontSize: 13, fontWeight: '700' },
  chanceTag: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  resultBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.l },
  resultCard: { gap: SIZES.m },
});
