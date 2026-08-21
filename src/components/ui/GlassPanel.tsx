import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';

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
 * so it still reads as glass either way. Colors come from useTheme() at
 * render time so this correctly switches between the dark and light theme.
 */
export default function GlassPanel({ children, style, intensity, tint, rounded = true }: GlassPanelProps) {
  const { glass, radius } = useTheme();
  return (
    <BlurView
      intensity={intensity ?? glass.intensity.regular}
      tint={tint ?? glass.tint}
      style={[
        styles.base,
        { borderColor: glass.border, backgroundColor: glass.fill.regular },
        rounded && { borderRadius: radius.xl },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', borderWidth: 1 },
});
