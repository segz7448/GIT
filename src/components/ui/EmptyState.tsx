import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import PremiumIcon from '../icons/PremiumIcon';
import { resolveGlyphName } from '../icons/legacyMap';
import Button from './Button';

export interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { palette, glass, radius } = useTheme();
  const glyph = resolveGlyphName(icon);
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { borderRadius: radius.pill, backgroundColor: glass.fill.regular, borderColor: glass.border },
        ]}
      >
        <PremiumIcon name={glyph} size={28} color={palette.ink500} />
      </View>
      {!!title && <Text style={[styles.title, { color: palette.ink100 }]}>{title}</Text>}
      {!!subtitle && <Text style={[styles.subtitle, { color: palette.ink500 }]}>{subtitle}</Text>}
      {!!actionLabel && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl * 1.5, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 64,
    height: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.sizeLg, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: typography.sizeSm, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 },
  action: { marginTop: spacing.lg },
});
