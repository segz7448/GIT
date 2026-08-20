import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { radii } from '../../theme';
import { palette, glass } from '../../theme/tokens';
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
  color = palette.ink100,
  onPress,
  style,
  variant = 'plain',
  disabled = false,
}: IconButtonProps) {
  const glyph = resolveGlyphName(name);
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'subtle' && styles.subtle,
        variant === 'glass' && styles.glass,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={8}
    >
      <PremiumIcon name={glyph} size={size} color={color} />
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
  subtle: { backgroundColor: glass.fill.regular, borderWidth: 1, borderColor: glass.border },
  glass: {
    backgroundColor: glass.fill.raised,
    borderWidth: 1,
    borderColor: glass.borderActive,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
