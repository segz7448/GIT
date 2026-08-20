import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { spacing } from '../../theme';
import { palette } from '../../theme/tokens';

export interface SectionLabelProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

export default function SectionLabel({ children, style }: SectionLabelProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: palette.ink500,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
