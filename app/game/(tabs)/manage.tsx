import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { Bar, Card, PrimaryButton, GhostButton, SectionTitle, EmptyState } from '@/components/ui';
import { Flag } from '@/components/emblems';
import { Icon } from '@/components/Icon';
import { GROUP_IDS } from '@/game/groups';
import { DIFFICULTY_PARAMS } from '@/game/engine';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function loyaltyColor(v: number): string {
  if (v >= 60) return COLORS.success;
  if (v < 30) return COLORS.danger;
  return COLORS.warning;
}

export default function ManageTab() {
  const router = useRouter();
  const { state, resetSave } = useGame();
  const [section, setSection] = useState<'menu' | 'groups' | 'log' | 'stats' | 'settings'>('menu');

  if (!state) {
    return <SafeAreaView style={styles.screen} edges={['top']}><EmptyState title="Нет активной игры" /></SafeAreaView>;
  }

  if (section !== 'menu') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => { haptic(); setSection('menu'); }} style={styles.backBtn}>
            <Icon name="ChevronLeft" size={20} color={COLORS.text} />
            <Text style={styles.backLabel}>Назад</Text>
          </TouchableOpacity>
          <Text style={TYPO.h2}>{sectionTitle(section)}</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
          {section === 'groups' && <GroupsView state={state} />}
          {section === 'log' && <LogView state={state} />}
          {section === 'stats' && <StatsView state={state} />}
          {section === 'settings' && (
            <SettingsView
              onReset={() => {
                Alert.alert(
                  'Сбросить прогресс?',
                  'Всё сохранение будет удалено безвозвратно.',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Сбросить',
                      style: 'destructive',
                      onPress: async () => {
                        haptic();
                        await resetSave();
                        router.replace('/');
                      },
                    },
                  ],
                  { cancelable: true },
                );
              }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  type SectionId = 'menu' | 'groups' | 'log' | 'stats' | 'settings';
  const menuItems: { key: SectionId; label: string; icon: string; desc: string }[] = [
    { key: 'groups', label: 'Группы населения', icon: 'Users', desc: 'Лояльность и интересы 8 групп' },
    { key: 'log', label: 'Журнал событий', icon: 'Scroll', desc: 'История решений и происшествий' },
    { key: 'stats', label: 'Статистика', icon: 'PieChart', desc: 'Сводка по стране и ходу' },
    { key: 'settings', label: 'Настройки и сохранение', icon: 'Settings', desc: 'Сброс прогресса, о игре' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Flag colors={state.flagColors} size={44} />
            <View style={{ flex: 1, marginLeft: SIZES.m }}>
              <Text style={TYPO.h2}>{state.countryName}</Text>
              <Text style={TYPO.small}>{DIFFICULTY_PARAMS[state.difficulty].label} сложность</Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Управление</SectionTitle>
        <View style={{ gap: SIZES.s }}>
          {menuItems.map((it) => (
            <TouchableOpacity key={it.key} activeOpacity={0.85} onPress={() => { haptic(); setSection(it.key); }}>
              <Card style={styles.menuRow}>
                <View style={styles.menuIcon}><Icon name={it.icon} size={22} color={COLORS.accent} /></View>
                <View style={{ flex: 1, marginLeft: SIZES.m }}>
                  <Text style={TYPO.h3}>{it.label}</Text>
                  <Text style={TYPO.small}>{it.desc}</Text>
                </View>
                <Icon name="ChevronRight" size={20} color={COLORS.textMute} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle>О игре</SectionTitle>
        <Card>
          <Text style={TYPO.body}>Железная Республика</Text>
          <Text style={TYPO.small}>Офлайн-политическая стратегия. Удерживайте власть, развивая страну и балансируя интересы групп населения. Прогресс сохраняется автоматически.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function sectionTitle(s: string): string {
  switch (s) {
    case 'groups': return 'Группы населения';
    case 'log': return 'Журнал событий';
    case 'stats': return 'Статистика';
    case 'settings': return 'Настройки';
    default: return '';
  }
}

function GroupsView({ state }: { state: any }) {
  return (
    <View style={{ gap: SIZES.s }}>
      {GROUP_IDS.map((gid) => {
        const g = state.groups[gid];
        return (
          <Card key={gid}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: g.color + '33' }]}>
                <Icon name={g.icon} size={20} color={g.color} />
              </View>
              <View style={{ flex: 1, marginLeft: SIZES.s }}>
                <Text style={TYPO.h3}>{g.name}</Text>
                <Text style={TYPO.small}>{g.interest}</Text>
              </View>
              <Text style={[styles.groupLoy, { color: loyaltyColor(g.loyalty) }]}>{Math.round(g.loyalty)}</Text>
            </View>
            <Bar value={g.loyalty} color={loyaltyColor(g.loyalty)} />
          </Card>
        );
      })}
      <Card style={{ opacity: 0.85 }}>
        <Text style={TYPO.small}>Лояльность ниже 30 — группа может поддержать оппозицию или переворот. Высокая лояльность военных и силовиков снижает риски, интеллигенции — повышает одобрение реформ.</Text>
      </Card>
    </View>
  );
}

function LogView({ state }: { state: any }) {
  const log = state.log;
  if (!log || log.length === 0) {
    return <EmptyState title="Журнал пуст" />;
  }
  const kindColor: Record<string, string> = {
    event: COLORS.accent,
    economy: COLORS.success,
    military: COLORS.primary,
    diplomacy: COLORS.info,
    build: COLORS.info,
    turn: COLORS.textMute,
    ending: COLORS.danger,
  };
  return (
    <View style={{ gap: 6 }}>
      {log.map((entry: any, i: number) => (
        <Card key={i} style={styles.logRow}>
          <View style={[styles.logDot, { backgroundColor: kindColor[entry.kind] || COLORS.textMute }]} />
          <View style={{ flex: 1 }}>
            <Text style={TYPO.small}>{entry.text}</Text>
            <Text style={styles.logTurn}>Ход {entry.turn}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

function StatsView({ state }: { state: GameState }) {
  const e = state.economy;
  const m = state.military;
  const completed = state.buildings.filter((b: any) => b.completed).length;
  return (
    <View style={{ gap: SIZES.s }}>
      <Card>
        <Text style={TYPO.h3}>Государство</Text>
        <View style={styles.statsGrid}>
          <Stat label="Год" val={state.year} />
          <Stat label="Ход" val={state.turn} />
          <Stat label="Сложность" val={DIFFICULTY_PARAMS[state.difficulty].label} />
          <Stat label="Стабильность" val={`${Math.round(state.stability)}/100`} />
          <Stat label="Поддержка" val={`${Math.round(state.approval)}/100`} />
          <Stat label="Недовольство" val={`${Math.round(state.unrest)}/100`} />
          <Stat label="Прогресс победы" val={`${Math.round(state.victoryProgress)}/100`} />
        </View>
      </Card>
      <Card>
        <Text style={TYPO.h3}>Экономика</Text>
        <View style={styles.statsGrid}>
          <Stat label="Казна" val={Math.round(e.treasury)} />
          <Stat label="Налоги" val={`${e.taxRate}%`} />
          <Stat label="Инфляция" val={`${e.inflation.toFixed(1)}%`} />
          <Stat label="Безработица" val={`${e.unemployment.toFixed(1)}%`} />
          <Stat label="Рост" val={`${e.growth.toFixed(1)}%`} />
          <Stat label="Долг" val={Math.round(e.debt)} />
          <Stat label="Промышленность" val={Math.round(e.industry)} />
          <Stat label="Сельское хоз." val={Math.round(e.agriculture)} />
          <Stat label="Инфраструктура" val={Math.round(e.infrastructure)} />
          <Stat label="Торговля" val={e.tradeBalance} />
        </View>
      </Card>
      <Card>
        <Text style={TYPO.h3}>Армия</Text>
        <View style={styles.statsGrid}>
          <Stat label="Сила армии" val={m.armyStrength} />
          <Stat label="Оборона" val={m.defense} />
          <Stat label="Безопасность" val={m.security} />
          <Stat label="Разведка" val={m.intelligence} />
          <Stat label="Воен. бюджет" val={m.armyBudget} />
        </View>
      </Card>
      <Card>
        <Text style={TYPO.h3}>Развитие</Text>
        <View style={styles.statsGrid}>
          <Stat label="Построено" val={completed} />
          <Stat label="В стройке" val={state.buildings.length - completed} />
          <Stat label="Реформ" val={state.upgrades.length} />
        </View>
      </Card>
    </View>
  );
}

function Stat({ label, val }: { label: string; val: any }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLbl}>{label}</Text>
      <Text style={styles.statVal}>{val}</Text>
    </View>
  );
}

function SettingsView({ onReset }: { onReset: () => void }) {
  return (
    <View style={{ gap: SIZES.m }}>
      <Card>
        <Text style={TYPO.h3}>Сохранение</Text>
        <Text style={TYPO.small}>Игра сохраняется автоматически в локальное хранилище устройства после каждого хода и решения. После закрытия и повторного запуска прогресс восстанавливается.</Text>
      </Card>
      <Card>
        <Text style={TYPO.h3}>Опасная зона</Text>
        <Text style={TYPO.small}>Сброс удалит всю историю и сохранение без возможности восстановления.</Text>
        <View style={{ height: SIZES.s }} />
        <GhostButton label="Сбросить прогресс" onPress={onReset} color={COLORS.danger} />
      </Card>
      <Card>
        <Text style={TYPO.h3}>О игре</Text>
        <Text style={TYPO.small}>«Железная Республика» — оригинальная политическая стратегия, вдохновлённая жанром диктаторских симуляторов. Все материалы, тексты и дизайн созданы с нуля и не нарушают чужие авторские права.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  heroCard: { gap: SIZES.s },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: SIZES.s + 4 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.cardElev, alignItems: 'center', justifyContent: 'center' },
  subHeader: { flexDirection: 'row', alignItems: 'center', padding: SIZES.m, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgElev, gap: SIZES.s },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backLabel: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.s },
  groupIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupLoy: { fontSize: 22, fontWeight: '700' },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.s, padding: SIZES.s },
  logDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  logTurn: { fontSize: 9, color: COLORS.textMute, marginTop: 2, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.s, marginTop: SIZES.s },
  statCell: { width: '47%', backgroundColor: COLORS.cardElev, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  statLbl: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
});
