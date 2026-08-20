/**
 * Premium design tokens — Phase 1 of the rewrite.
 *
 * This is additive to `src/theme.js`, not a replacement yet: existing
 * screens keep importing from `theme.js` until they're migrated in
 * Phase 3. New/rewritten components should import from here instead.
 */

export const palette = {
  // Deep-space base, tuned so glass surfaces read as translucent rather
  // than just "dark grey with a border".
  space900: '#05060a',
  space800: '#0a0d14',
  space700: '#11151f',
  space600: '#1a2030',
  hairline: '#ffffff1f',
  hairlineStrong: '#ffffff3d',

  ink100: '#f5f7ff',
  ink300: '#c7cee0',
  ink500: '#8a91ab',
  ink700: '#5b6180',

  azure: '#4f8dff',
  azureBright: '#7db2ff',
  violet: '#9b7bff',
  mint: '#31e0a4',
  amber: '#ffb84d',
  coral: '#ff6b7a',
} as const;

export const glass = {
  // BlurView intensity presets (expo-blur, 0-100)
  intensity: { thin: 22, regular: 40, thick: 62, heavy: 85 },
  tint: 'dark' as const,
  // Fill layered *under* the blur so it still reads as glass on API<31
  // devices where expo-blur falls back to a flat tint.
  fill: {
    thin: 'rgba(255,255,255,0.04)',
    regular: 'rgba(255,255,255,0.07)',
    raised: 'rgba(255,255,255,0.10)',
  },
  border: palette.hairline,
  borderActive: palette.hairlineStrong,
} as const;

export const gradient = {
  brand: [palette.azure, palette.violet] as const,
  brandSoft: ['#4f8dff33', '#9b7bff00'] as const,
  sheen: ['#ffffff26', '#ffffff00'] as const,
  success: [palette.mint, '#1fae7f'] as const,
  danger: [palette.coral, '#c9384b'] as const,
  surfaceDepth: [palette.space700, palette.space900] as const,
};

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const motion = {
  // Reanimated spring configs for icon/button micro-interactions.
  pressSpring: { damping: 16, stiffness: 260, mass: 0.6 },
  focusSpring: { damping: 14, stiffness: 180, mass: 0.7 },
  quick: 140,
  base: 220,
  slow: 340,
};

export const elevationGlass = {
  none: {},
  sm: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  md: { shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  lg: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
};

export type Palette = typeof palette;
