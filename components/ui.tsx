import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, TYPO } from './theme';

export function Bar({ value, max = 100, color = COLORS.primary, height = 8, label }: { value: number; max?: number; color?: string; height?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={styles.barWrap}>
      <View style={[styles.barTrack, { height }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color, height }]} />
      </View>
      {label ? <Text style={styles.barLabel}>{label}</Text> : null}
    </View>
  );
}

export function StatChip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={[styles.chip, { borderColor: color || COLORS.border }]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color: color || COLORS.text }]}>{value}</Text>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, disabled, color, icon }: { label: string; onPress?: () => void; disabled?: boolean; color?: string; icon?: React.ReactNode }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled} style={[disabled && styles.btnDisabled]}>
      <LinearGradient
        colors={disabled ? [COLORS.primaryDim, COLORS.primaryDim] : [color || COLORS.primary, color ? color : '#2a5485']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtn}
      >
        {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
        <Text style={styles.primaryBtnLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({ label, onPress, disabled, color }: { label: string; onPress?: () => void; disabled?: boolean; color?: string }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled} style={[styles.ghostBtn, { borderColor: color || COLORS.border }, disabled && styles.btnDisabled]}>
      <Text style={[styles.ghostBtnLabel, { color: color || COLORS.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={TYPO.h3}>{children}</Text>
      {right}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={TYPO.h3}>{title}</Text>
      {subtitle ? <Text style={TYPO.small}>{subtitle}</Text> : null}
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: SIZES.s },
  barTrack: { flex: 1, backgroundColor: COLORS.bgElev, borderRadius: 4, overflow: 'hidden' },
  barFill: { borderRadius: 4 },
  barLabel: { fontSize: 11, color: COLORS.textDim, minWidth: 40, textAlign: 'right' },
  chip: { backgroundColor: COLORS.cardElev, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, minWidth: 70 },
  chipLabel: { fontSize: 9, color: COLORS.textMute, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipValue: { fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: SIZES.m, borderWidth: 1, borderColor: COLORS.border },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ghostBtnLabel: { fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.45 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: SIZES.s },
  empty: { alignItems: 'center', justifyContent: 'center', padding: SIZES.xl, gap: SIZES.s },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
