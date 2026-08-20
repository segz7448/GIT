import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass, radius } from '../../theme/tokens';

export interface GlassPanelProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  rounded?: boolean;
}

/**
 * Frosted-glass surface. expo-blur gives a real native blur on API 31+;
 * below that it falls back to the translucent `fill` layered underneath,
 * so it still reads as glass either way.
 */
export default function GlassPanel({
  children,
  style,
  intensity = glass.intensity.regular,
  tint = glass.tint,
  rounded = true,
}: GlassPanelProps) {
  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.base, rounded && styles.rounded, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill.regular,
  },
  rounded: { borderRadius: radius.xl },
});
