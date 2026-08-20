import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
import { palette, radius } from '../../theme/tokens';

const TONES = {
  neutral: { bg: 'rgba(139,145,171,0.16)', fg: palette.ink500, dot: palette.ink500 },
  accent: { bg: 'rgba(79,141,255,0.16)', fg: palette.azureBright, dot: palette.azure },
  success: { bg: 'rgba(49,224,164,0.16)', fg: palette.mint, dot: palette.mint },
  danger: { bg: 'rgba(255,107,122,0.16)', fg: palette.coral, dot: palette.coral },
  warning: { bg: 'rgba(255,184,77,0.16)', fg: palette.amber, dot: palette.amber },
  done: { bg: 'rgba(155,123,255,0.16)', fg: palette.violet, dot: palette.violet },
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  small?: boolean;
}

export default function Badge({ label, tone = 'neutral', dot = false, small = false }: BadgeProps) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.base, { backgroundColor: t.bg }, small && styles.small]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.dot }]} />}
      <Text style={[styles.text, { color: t.fg }, small && styles.textSmall]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: spacing.xs, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontSize: typography.sizeSm, fontWeight: '600' },
  textSmall: { fontSize: 10 },
});
