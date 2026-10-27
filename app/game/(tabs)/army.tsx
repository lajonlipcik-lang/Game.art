import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { Bar, Card, GhostButton, SectionTitle, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function ArmyTab() {
  const { state, changeArmyBudget } = useGame();

  if (!state) {
    return <SafeAreaView style={styles.screen} edges={['top']}><EmptyState title="Нет активной игры" /></SafeAreaView>;
  }

  const m = state.military;
  const threat = Object.values(state.countries).filter((c) => c.relation < -30).length;
  const strongest = Math.max(...Object.values(state.countries).map((c) => c.armyStrength));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: SIZES.m, paddingBottom: SIZES.xl + 16 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Icon name="Shield" size={28} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: SIZES.m }}>
              <Text style={TYPO.h2}>Армия и безопасность</Text>
              <Text style={TYPO.small}>Оборона страны и внутренний порядок</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStatCell}><Text style={styles.heroStatVal}>{m.armyStrength}</Text><Text style={styles.heroStatLbl}>Сила армии</Text></View>
            <View style={styles.heroStatCell}><Text style={styles.heroStatVal}>{m.defense}</Text><Text style={styles.heroStatLbl}>Оборона</Text></View>
            <View style={styles.heroStatCell}><Text style={styles.heroStatVal}>{m.security}</Text><Text style={styles.heroStatLbl}>Безопасность</Text></View>
            <View style={styles.heroStatCell}><Text style={styles.heroStatVal}>{m.intelligence}</Text><Text style={styles.heroStatLbl}>Разведка</Text></View>
          </View>
        </Card>

        <SectionTitle>Военный бюджет</SectionTitle>
        <Card>
          <View style={styles.budgetRow}>
            <Text style={TYPO.h3}>{m.armyBudget}/ход</Text>
            <Text style={TYPO.small}>Финансирует армию и спецслужбы</Text>
          </View>
          <View style={styles.budgetControls}>
            <GhostButton label="−5" onPress={() => { haptic(); changeArmyBudget(m.armyBudget - 5); }} color={COLORS.danger} />
            <GhostButton label="−1" onPress={() => { haptic(); changeArmyBudget(m.armyBudget - 1); }} />
            <GhostButton label="+1" onPress={() => { haptic(); changeArmyBudget(m.armyBudget + 1); }} />
            <GhostButton label="+5" onPress={() => { haptic(); changeArmyBudget(m.armyBudget + 5); }} color={COLORS.success} />
          </View>
          <Text style={TYPO.small}>Низкий бюджет снижает лояльность военных. Высокий — повышает.</Text>
        </Card>

        <SectionTitle>Боеготовность</SectionTitle>
        <Card style={{ gap: SIZES.s }}>
          <Indicator label="Численность и оснащение" value={m.armyStrength} icon="Sword" color={m.armyStrength > 60 ? COLORS.success : m.armyStrength > 35 ? COLORS.warning : COLORS.danger} />
          <Indicator label="Оборонительные сооружения" value={m.defense} icon="Shield" color={m.defense > 60 ? COLORS.success : m.defense > 35 ? COLORS.warning : COLORS.danger} />
          <Indicator label="Внутренняя безопасность" value={m.security} icon="Eye" color={m.security > 60 ? COLORS.success : m.security > 35 ? COLORS.warning : COLORS.danger} />
          <Indicator label="Военная разведка" value={m.intelligence} icon="Eye" color={m.intelligence > 60 ? COLORS.success : m.intelligence > 35 ? COLORS.warning : COLORS.danger} />
        </Card>

        <SectionTitle>Внешние угрозы</SectionTitle>
        <Card>
          <View style={styles.threatRow}>
            <View style={styles.threatCell}><Text style={styles.threatVal}>{threat}</Text><Text style={styles.threatLbl}>Враждебных держав</Text></View>
            <View style={styles.threatCell}><Text style={styles.threatVal}>{strongest}</Text><Text style={styles.threatLbl}>Сильнейшая армия</Text></View>
          </View>
          <Text style={TYPO.small}>Сильная армия и оборона повышают шансы в кризисах. Слабая — риск переворота и внешнего свержения.</Text>
        </Card>

        <SectionTitle>Совет</SectionTitle>
        <Card>
          <Text style={TYPO.small}>
            {m.armyStrength < 40
              ? 'Армия слаба. Постройте военные базы и проведите модернизацию, иначе риск переворота и поражения в конфликтах возрастёт.'
              : m.security < 40
                ? 'Безопасность низкая. Усильте разведку и контрразведку для защиты от заговоров и терактов.'
                : m.defense < 40
                  ? 'Оборона недостаточна. Постройте укрепления на границах.'
                  : 'Армия в хорошем состоянии. Поддерживайте финансирование.'}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Indicator({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={16} color={COLORS.textDim} />
          <Text style={TYPO.body}>{label}</Text>
        </View>
        <Text style={[TYPO.body, { fontWeight: '700', color }]}>{Math.round(value)}</Text>
      </View>
      <Bar value={value} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  heroCard: { gap: SIZES.m },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStats: { flexDirection: 'row', gap: SIZES.s },
  heroStatCell: { flex: 1, backgroundColor: COLORS.cardElev, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  heroStatLbl: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase', marginTop: 2 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.s },
  budgetControls: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: SIZES.s },
  threatRow: { flexDirection: 'row', gap: SIZES.s, marginBottom: SIZES.s },
  threatCell: { flex: 1, backgroundColor: COLORS.cardElev, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  threatVal: { fontSize: 22, fontWeight: '700', color: COLORS.danger },
  threatLbl: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase', marginTop: 2 },
});
