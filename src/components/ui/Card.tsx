import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { glass, radius, elevationGlass } from '../../theme/tokens';
import { haptic } from '../../utils/haptics';

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  inset?: boolean;
  level?: keyof typeof elevationGlass;
  disabled?: boolean;
}

/**
 * Base glass surface used everywhere: list rows, detail panels, modal
 * sheets. Pass onPress to make it tappable (adds haptic + press feedback).
 */
export default function Card({ children, style, onPress, inset = false, level = 'sm', disabled }: CardProps) {
  const surfaceStyle = [styles.base, inset ? styles.inset : styles.subtle, elevationGlass[level], style];

  if (onPress) {
    return (
      <Pressable
        disabled={disabled}
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        style={({ pressed }) => [...surfaceStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={surfaceStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  subtle: { backgroundColor: glass.fill.regular, borderColor: glass.border },
  inset: { backgroundColor: glass.fill.thin, borderColor: glass.border },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
});
