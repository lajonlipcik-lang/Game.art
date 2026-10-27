import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from './theme';

// Simple three-band flag with a central star (original design).
export function Flag({ colors, size = 60, style }: { colors: [string, string, string]; size?: number; style?: any }) {
  return (
    <View style={[{ width: size * 1.5, height: size, borderRadius: 4, overflow: 'hidden', flexDirection: 'column', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }, style]}>
      <View style={{ flex: 1, backgroundColor: colors[0] }} />
      <View style={{ flex: 1, backgroundColor: colors[1], alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.star} />
      </View>
      <View style={{ flex: 1, backgroundColor: colors[2] }} />
    </View>
  );
}

// Stylized leader portrait silhouette (original geometric design).
export function LeaderPortrait({ size = 72, color = COLORS.accent }: { size?: number; color?: string }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.cardElev, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color }, styles.portrait]}>
      <View style={{ width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, backgroundColor: color, opacity: 0.9, marginBottom: -size * 0.05 }} />
      <View style={{ width: size * 0.5, height: size * 0.3, backgroundColor: color, opacity: 0.8, borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    transform: [{ rotate: '45deg' }],
  },
  portrait: {
    overflow: 'hidden',
  },
});
