import { StyleSheet } from 'react-native';

// State colors palette — deep civic tones, no purple.
export const COLORS = {
  bg: '#0f1722',
  bgElev: '#172234',
  card: '#1c2942',
  cardElev: '#22344f',
  border: '#2a3a55',
  text: '#e8eef7',
  textDim: '#9fb0c8',
  textMute: '#6b7d99',
  primary: '#3b6fb0',
  primaryDim: '#2a5485',
  accent: '#c9a227',
  success: '#3f9b5e',
  warning: '#d98a3a',
  danger: '#c0563b',
  info: '#5b9bd1',
  // group colors come from group defs
};

export const SIZES = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const TYPO = {
  title: { fontSize: 22, fontWeight: '700' as const, color: COLORS.text, letterSpacing: 0.3 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: COLORS.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: COLORS.text },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  small: { fontSize: 12, color: COLORS.textDim, lineHeight: 16 },
  micro: { fontSize: 10, color: COLORS.textMute, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

export const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pad: { padding: SIZES.m },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SIZES.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  col: { flexDirection: 'column' },
  center: { alignItems: 'center', justifyContent: 'center' },
  gapS: { gap: SIZES.s },
  gapM: { gap: SIZES.m },
  sectionTitle: { ...TYPO.h3, marginVertical: SIZES.s },
});
