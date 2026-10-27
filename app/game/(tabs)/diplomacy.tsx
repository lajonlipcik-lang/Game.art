import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { Bar, Card, PrimaryButton, GhostButton, SectionTitle, EmptyState } from '@/components/ui';
import { Flag } from '@/components/emblems';
import { Icon } from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function relColor(r: number): string {
  if (r > 30) return COLORS.success;
  if (r < -30) return COLORS.danger;
  return COLORS.warning;
}

function relLabel(r: number): string {
  if (r > 60) return 'Союз';
  if (r > 20) return 'Дружба';
  if (r > -20) return 'Нейтрально';
  if (r > -60) return 'Напряжённость';
  return 'Враждебно';
}

export default function DiplomacyTab() {
  const { state, diplomacy } = useGame();

  if (!state) {
    return <SafeAreaView style={styles.screen} edges={['top']}><EmptyState title="Нет активной игры" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Icon name="Globe" size={26} color={COLORS.info} />
            <View style={{ flex: 1, marginLeft: SIZES.m }}>
              <Text style={TYPO.h2}>Дипломатия</Text>
              <Text style={TYPO.small}>Отношения с соседними государствами</Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Государства региона</SectionTitle>
        <View style={{ gap: SIZES.m }}>
          {Object.values(state.countries).map((c) => (
            <Card key={c.id} style={styles.countryCard}>
              <View style={styles.countryHeader}>
                <Flag colors={c.flagColors} size={36} />
                <View style={{ flex: 1, marginLeft: SIZES.m }}>
                  <Text style={TYPO.h3}>{c.name}</Text>
                  <Text style={TYPO.small}>{c.trait}</Text>
                </View>
                <View style={styles.relBadge}>
                  <Text style={[styles.relVal, { color: relColor(c.relation) }]}>{c.relation > 0 ? '+' : ''}{c.relation}</Text>
                  <Text style={styles.relLbl}>{relLabel(c.relation)}</Text>
                </View>
              </View>

              <Bar value={(c.relation + 100) / 2} color={relColor(c.relation)} />

              <View style={styles.countryMetaRow}>
                <Text style={styles.metaCell}>Сила армии: {c.armyStrength}</Text>
              </View>

              <View style={styles.actionsGrid}>
                <GhostButton label="Торговля (−20)" onPress={() => { haptic(); diplomacy(c.id, 'trade'); }} color={COLORS.success} />
                <GhostButton label="Улучшить (−15)" onPress={() => { haptic(); diplomacy(c.id, 'improve'); }} color={COLORS.info} />
                <GhostButton label="Помощь (−40)" onPress={() => { haptic(); diplomacy(c.id, 'aid'); }} color={COLORS.accent} />
                <GhostButton label="Санкции" onPress={() => { haptic(); diplomacy(c.id, 'sanctions'); }} color={COLORS.danger} />
              </View>
            </Card>
          ))}
        </View>

        <SectionTitle>Совет</SectionTitle>
        <Card>
          <Text style={TYPO.small}>
            Торговля и помощь улучшают отношения и приносят доход от торговли. Санкции ухудшают отношения и снижают торговый баланс. Слишком много врагов грозит внешним свержением.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  heroCard: { gap: SIZES.s },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  countryCard: { gap: SIZES.s },
  countryHeader: { flexDirection: 'row', alignItems: 'center' },
  relBadge: { alignItems: 'flex-end' },
  relVal: { fontSize: 18, fontWeight: '700' },
  relLbl: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase' },
  countryMetaRow: { flexDirection: 'row', gap: SIZES.s },
  metaCell: { fontSize: 11, color: COLORS.textDim, backgroundColor: COLORS.cardElev, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
