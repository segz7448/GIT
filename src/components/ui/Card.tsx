import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { haptic } from '../../utils/haptics';

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  inset?: boolean;
  level?: 'none' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * Base glass surface used everywhere: list rows, detail panels, modal
 * sheets. Pass onPress to make it tappable (adds haptic + press feedback).
 * Colors/elevation come from useTheme() at render time so this correctly
 * switches between the dark and light theme.
 */
export default function Card({ children, style, onPress, inset = false, level = 'sm', disabled }: CardProps) {
  const { glass, radius, elevationGlass } = useTheme();
  const surfaceStyle = [
    styles.base,
    { borderRadius: radius.lg },
    inset
      ? { backgroundColor: glass.fill.thin, borderColor: glass.border }
      : { backgroundColor: glass.fill.regular, borderColor: glass.border },
    elevationGlass[level],
    style,
  ];

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
  base: { borderWidth: 1, padding: spacing.md },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
});
