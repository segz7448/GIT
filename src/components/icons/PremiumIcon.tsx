import React, { useCallback } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { ICON_MAP } from './glyphs';
import { palette, motion, glass, radius } from '../../theme/tokens';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export interface PremiumIconProps {
  /** A semantic key from ICON_MAP (e.g. "repo") or a raw Ionicons glyph
   * name (e.g. "cloud-offline-outline") - both are valid. */
  name: string;
  size?: number;
  active?: boolean;
  color?: string;
  activeColor?: string;
  /** Wrap in a frosted glass "halo" - for nav bars / side menu items. */
  halo?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * Real Expo icon (@expo/vector-icons Ionicons), wrapped in premium chrome:
 *  - press-spring scale/opacity feedback
 *  - animated color transition between resting and active tint
 *  - outline -> filled glyph swap on `active` (when the semantic entry
 *    has a distinct filled variant - see glyphs.ts)
 *  - optional frosted glass halo background for nav/menu placement
 *
 * This is never a plain static <Ionicons> render and never emoji - the
 * animation/halo/active-swap chrome is what makes it "premium" rather
 * than "basic".
 */
export default function PremiumIcon({
  name,
  size = 24,
  active = false,
  color = palette.ink300,
  activeColor = palette.azureBright,
  halo = false,
  onPress,
  style,
  accessibilityLabel,
}: PremiumIconProps) {
  const pressed = useSharedValue(0);
  const activeProgress = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: motion.base });
  }, [active]);

  const entry = ICON_MAP[name];
  const iconName = (entry ? (active ? entry.filled : entry.outline) : name) as any;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.12, motion.pressSpring) }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], [color, activeColor]),
    opacity: 1 - pressed.value * 0.15,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', 'rgba(79,141,255,0.16)']
    ),
    borderColor: interpolateColor(activeProgress.value, [0, 1], [glass.border, 'rgba(125,178,255,0.55)']),
  }));

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, motion.pressSpring);
  }, []);
  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, motion.pressSpring);
  }, []);

  const glyph = (
    <Animated.View style={containerStyle}>
      <AnimatedIonicons name={iconName} size={size} style={iconAnimatedStyle} />
    </Animated.View>
  );

  const content = halo ? (
    <Animated.View style={[styles.halo, { width: size + 22, height: size + 22 }, haloStyle]}>{glyph}</Animated.View>
  ) : (
    glyph
  );

  if (!onPress) {
    return (
      <View style={style} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
