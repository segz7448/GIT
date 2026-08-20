import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../../theme/tokens';

export interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Deep-space top-to-bottom gradient wash instead of a flat background
 * color — depth without touching every screen's layout logic.
 */
export default function Screen({ children, style }: ScreenProps) {
  return (
    <View style={[styles.flex, style]}>
      <LinearGradient
        colors={[palette.space700, palette.space800, palette.space900]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
