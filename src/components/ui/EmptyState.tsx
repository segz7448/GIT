import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
import { palette, glass, radius } from '../../theme/tokens';
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
  const glyph = resolveGlyphName(icon);
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <PremiumIcon name={glyph} size={28} color={palette.ink500} />
      </View>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    borderRadius: radius.pill,
    backgroundColor: glass.fill.regular,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: palette.ink100, fontSize: typography.sizeLg, fontWeight: '600', textAlign: 'center' },
  subtitle: {
    color: palette.ink500,
    fontSize: typography.sizeSm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  action: { marginTop: spacing.lg },
});
