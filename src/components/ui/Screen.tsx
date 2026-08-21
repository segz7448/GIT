import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

export interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Background gradient wash instead of a flat color - depth without
 * touching every screen's layout logic. Reads `gradient.surfaceDepth`
 * from useTheme() at render time (not a module-scope StyleSheet), so it
 * switches correctly between the dark and light theme.
 */
export default function Screen({ children, style }: ScreenProps) {
  const { gradient } = useTheme();
  return (
    <View style={[styles.flex, style]}>
      <LinearGradient colors={gradient.surfaceDepth} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
