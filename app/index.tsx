import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { COLORS, SIZES, TYPO } from '@/components/theme';
import { PrimaryButton, GhostButton, Card } from '@/components/ui';
import { Flag, LeaderPortrait } from '@/components/emblems';
import { Icon } from '@/components/Icon';
import { DIFFICULTY_PARAMS } from '@/game/engine';
import type { Difficulty } from '@/game/types';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function MainMenu() {
  const router = useRouter();
  const { hasExistingSave, continueGame, startNewGame, resetSave, state, loading } = useGame();
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [saveSummary, setSaveSummary] = useState<string | null>(null);

  React.useEffect(() => {
    if (state && !state.ending) {
      setSaveSummary(`Год ${state.year} · Ход ${state.turn} · Казна ${Math.round(state.economy.treasury)}`);
    }
  }, [state]);

  const handleContinue = async () => {
    haptic();
    await continueGame();
    router.push('/game/(tabs)');
  };

  const handleNew = () => {
    haptic();
    setShowDifficulty(true);
  };

  const pickDifficulty = (d: Difficulty) => {
    haptic();
    setShowDifficulty(false);
    startNewGame(d);
    router.push('/game/(tabs)');
  };

  const handleReset = () => {
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
            setSaveSummary(null);
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (loading) {
    return <View style={styles.loading}><Text style={TYPO.small}>Загрузка...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Flag colors={['#1d4ed8', '#ffffff', '#b91c1c']} size={70} />
          <View style={styles.titleBlock}>
            <Text style={styles.gameTitle}>Железная Республика</Text>
            <Text style={styles.subtitle}>Политическая стратегия · Офлайн</Text>
          </View>
        </View>

        <LeaderPortrait size={90} />

        <Text style={styles.tagline}>
          Вы — лидер Республики. Удержите власть, развивайте страну и переживите кризисы.
        </Text>

        <View style={styles.menu}>
          {hasExistingSave && saveSummary ? (
            <Card style={{ marginBottom: SIZES.s }}>
              <Text style={TYPO.micro}>Текущее сохранение</Text>
              <Text style={[TYPO.body, { marginTop: 4 }]}>{saveSummary}</Text>
            </Card>
          ) : null}

          {hasExistingSave ? (
            <PrimaryButton label="Продолжить" onPress={handleContinue} />
          ) : null}
          <PrimaryButton label="Новая игра" onPress={handleNew} color={COLORS.accent} />
          {hasExistingSave ? (
            <GhostButton label="Сбросить прогресс" onPress={handleReset} color={COLORS.danger} />
          ) : null}
        </View>

        <View style={styles.footerNote}>
          <Icon name="Shield" size={14} color={COLORS.textMute} />
          <Text style={styles.footerText}>Игра полностью офлайн. Прогресс сохраняется автоматически.</Text>
        </View>
      </ScrollView>

      <Modal visible={showDifficulty} transparent animationType="slide" onRequestClose={() => setShowDifficulty(false)}>
        <View style={styles.modalBg}>
          <Card style={styles.modalCard}>
            <Text style={TYPO.h2}>Выберите сложность</Text>
            {(Object.keys(DIFFICULTY_PARAMS) as Difficulty[]).map((d) => {
              const p = DIFFICULTY_PARAMS[d];
              return (
                <TouchableOpacity key={d} style={styles.diffRow} onPress={() => pickDifficulty(d)}>
                  <View style={{ flex: 1 }}>
                    <Text style={TYPO.h3}>{p.label}</Text>
                    <Text style={TYPO.small}>Стартовая казна: {p.startingTreasury} · Сложнее кризисы</Text>
                  </View>
                  <Icon name="ChevronRight" size={20} color={COLORS.textDim} />
                </TouchableOpacity>
              );
            })}
            <GhostButton label="Отмена" onPress={() => setShowDifficulty(false)} />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.l, alignItems: 'center', paddingTop: SIZES.xl + 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SIZES.m, marginBottom: SIZES.l },
  titleBlock: { flex: 1 },
  gameTitle: { fontSize: 26, fontWeight: '700', color: COLORS.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  tagline: { ...TYPO.body, textAlign: 'center', marginVertical: SIZES.l, color: COLORS.textDim, paddingHorizontal: SIZES.l },
  menu: { width: '100%', maxWidth: 380, gap: SIZES.m, marginTop: SIZES.s },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SIZES.xl, paddingHorizontal: SIZES.l },
  footerText: { fontSize: 11, color: COLORS.textMute, flex: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.l },
  modalCard: { gap: SIZES.m },
  diffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.s, borderBottomWidth: 1, borderBottomColor: COLORS.border },
});
