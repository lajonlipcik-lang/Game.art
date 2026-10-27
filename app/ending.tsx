import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { PrimaryButton, GhostButton, Card } from '@/components/ui';
import { Flag } from '@/components/emblems';
import { Icon } from '@/components/Icon';
import { endingText } from '@/game/engine';
import type { EndingId } from '@/game/types';

const ENDING_TITLE: Record<EndingId, string> = {
  triumph: 'Триумф',
  revolution: 'Революция',
  coup: 'Военный переворот',
  bankruptcy: 'Банкротство',
  collapse: 'Распад государства',
  overthrow_external: 'Свержение извне',
};

const ENDING_ICON: Record<EndingId, string> = {
  triumph: 'Crown',
  revolution: 'Flame',
  coup: 'Swords',
  bankruptcy: 'Banknote',
  collapse: 'AlertTriangle',
  overthrow_external: 'Globe',
};

const ENDING_COLOR: Record<EndingId, string> = {
  triumph: COLORS.accent,
  revolution: COLORS.danger,
  coup: COLORS.danger,
  bankruptcy: COLORS.warning,
  collapse: COLORS.danger,
  overthrow_external: COLORS.danger,
};

export default function EndingScreen() {
  const router = useRouter();
  const { ending, state, resetSave } = useGame();

  if (!ending || !state) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={TYPO.body}>Игра не завершена.</Text>
          <PrimaryButton label="В меню" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const isVictory = ending === 'triumph';
  const color = ENDING_COLOR[ending];

  const handleNew = async () => {
    await resetSave();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: SIZES.l, alignItems: 'center', paddingTop: SIZES.xl + 12 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconCircle, { backgroundColor: color + '22', borderColor: color }]}>
          <Icon name={ENDING_ICON[ending]} size={48} color={color} />
        </View>

        <Text style={[TYPO.h2, { marginTop: SIZES.l, color }]}>{ENDING_TITLE[ending]}</Text>
        <Text style={styles.gameName}>{state.countryName}</Text>
        <Text style={TYPO.small}>Год {state.year} · Ход {state.turn}</Text>

        <View style={{ height: SIZES.l }} />

        <Card style={styles.resultCard}>
          <Text style={[TYPO.body, { textAlign: 'center' }]}>{endingText(ending)}</Text>
        </Card>

        <View style={{ height: SIZES.l }} />

        <Card style={styles.summaryCard}>
          <Text style={TYPO.h3}>Итоги правления</Text>
          <View style={styles.summaryRow}>
            <SummaryItem label="Ходов у власти" val={state.turn} />
            <SummaryItem label="Казна" val={Math.round(state.economy.treasury)} />
            <SummaryItem label="Стабильность" val={`${Math.round(state.stability)}/100`} />
            <SummaryItem label="Поддержка" val={`${Math.round(state.approval)}/100`} />
            <SummaryItem label="Построено" val={state.buildings.filter((b) => b.completed).length} />
            <SummaryItem label="Реформ" val={state.upgrades.length} />
          </View>
        </Card>

        <View style={{ height: SIZES.l }} />
        <View style={styles.actions}>
          <PrimaryButton label="Новая игра" onPress={handleNew} color={isVictory ? COLORS.accent : COLORS.primary} />
          <GhostButton label="В главное меню" onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, val }: { label: string; val: any }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLbl}>{label}</Text>
      <Text style={styles.summaryVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.m, padding: SIZES.l },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  gameName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  resultCard: { width: '100%', alignItems: 'center' },
  summaryCard: { width: '100%' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.s, marginTop: SIZES.s },
  summaryItem: { width: '47%', backgroundColor: COLORS.cardElev, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  summaryLbl: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase' },
  summaryVal: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  actions: { width: '100%', maxWidth: 380, gap: SIZES.m },
});
