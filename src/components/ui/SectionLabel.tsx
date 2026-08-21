import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface SectionLabelProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

export default function SectionLabel({ children, style }: SectionLabelProps) {
  const { palette } = useTheme();
  return <Text style={[styles.label, { color: palette.ink500 }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
