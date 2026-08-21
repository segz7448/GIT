import React from 'react';
import { Text, ActivityIndicator, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { haptic } from '../../utils/haptics';
import PremiumIcon from '../icons/PremiumIcon';
import { resolveGlyphName } from '../icons/legacyMap';

const SIZES = {
  sm: { paddingVertical: 8, fontSize: typography.sizeSm, iconSize: 14 },
  md: { paddingVertical: 12, fontSize: typography.sizeMd, iconSize: 16 },
  lg: { paddingVertical: 15, fontSize: typography.sizeLg, iconSize: 18 },
} as const;

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary' | 'ghost';
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticStyle?: keyof typeof haptic | false;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  hapticStyle = 'tap',
}: ButtonProps) {
  const { palette, gradient, glass } = useTheme();
  const dims = SIZES[size] || SIZES.md;
  const isFilled = variant === 'primary' || variant === 'success' || variant === 'danger';
  const isGhost = variant === 'ghost';

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticStyle && haptic[hapticStyle]) haptic[hapticStyle]();
    onPress?.();
  };

  const iconColor = isFilled ? '#fff' : variant === 'secondary' ? palette.ink100 : palette.azureBright;
  const glyph = icon ? resolveGlyphName(icon) : undefined;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isFilled ? '#fff' : palette.azureBright} size="small" />
      ) : (
        <>
          {glyph && iconPosition === 'left' && (
            <PremiumIcon name={glyph} size={dims.iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text
            style={[
              styles.text,
              { fontSize: dims.fontSize },
              isFilled && styles.textFilled,
              variant === 'secondary' && { color: palette.ink100 },
              isGhost && { color: palette.azureBright },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {glyph && iconPosition === 'right' && (
            <PremiumIcon name={glyph} size={dims.iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </>
  );

  const baseStyle = [
    styles.base,
    { paddingVertical: dims.paddingVertical },
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  if (isFilled) {
    const gradientColors =
      variant === 'success' ? gradient.success : variant === 'danger' ? gradient.danger : gradient.brand;
    return (
      <Pressable onPress={handlePress} disabled={disabled || loading} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseStyle}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        baseStyle,
        variant === 'secondary' && { backgroundColor: glass.fill.regular, borderWidth: 1, borderColor: glass.border },
        isGhost && styles.ghostBox,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ghostBox: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  text: { fontWeight: '600' },
  textFilled: { color: '#fff' },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },
});
