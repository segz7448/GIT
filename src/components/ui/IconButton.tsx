import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { haptic } from '../../utils/haptics';
import PremiumIcon from '../icons/PremiumIcon';
import { resolveGlyphName } from '../icons/legacyMap';

export interface IconButtonProps {
  name: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'plain' | 'subtle' | 'glass';
  disabled?: boolean;
}

export default function IconButton({
  name,
  size = 20,
  color,
  onPress,
  style,
  variant = 'plain',
  disabled = false,
}: IconButtonProps) {
  const { palette, glass } = useTheme();
  const glyph = resolveGlyphName(name);
  const resolvedColor = color ?? palette.ink100;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'subtle' && { backgroundColor: glass.fill.regular, borderWidth: 1, borderColor: glass.border },
        variant === 'glass' && { backgroundColor: glass.fill.raised, borderWidth: 1, borderColor: glass.borderActive },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={8}
    >
      <PremiumIcon name={glyph} size={size} color={resolvedColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
