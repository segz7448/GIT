/**
 * Light/dark palette pairs. Two shapes, kept in sync:
 *  - `colors`  - the original flat GitHub-style palette (src/theme.js)
 *  - `palette`/`glass`/`gradient` - the glassmorphic tokens (tokens.ts)
 *
 * Non-color tokens (spacing, radius, motion, elevation) don't need a
 * light/dark variant and are re-exported as-is from tokens.ts.
 */

export interface FlatColors {
  bgDefault: string;
  bgSubtle: string;
  bgInset: string;
  border: string;
  borderMuted: string;
  fgDefault: string;
  fgMuted: string;
  fgSubtle: string;
  accent: string;
  accentEmphasis: string;
  success: string;
  successEmphasis: string;
  danger: string;
  dangerEmphasis: string;
  warning: string;
  warningEmphasis: string;
  neutralMuted: string;
  done: string;
}

export interface GlassPalette {
  space900: string;
  space800: string;
  space700: string;
  space600: string;
  hairline: string;
  hairlineStrong: string;
  ink100: string;
  ink300: string;
  ink500: string;
  ink700: string;
  azure: string;
  azureBright: string;
  violet: string;
  mint: string;
  amber: string;
  coral: string;
}

export interface GlassTokens {
  intensity: { thin: number; regular: number; thick: number; heavy: number };
  tint: 'dark' | 'light';
  fill: { thin: string; regular: string; raised: string };
  border: string;
  borderActive: string;
}

export interface ThemeDefinition {
  scheme: 'dark' | 'light';
  colors: FlatColors;
  palette: GlassPalette;
  glass: GlassTokens;
  gradient: {
    brand: readonly [string, string];
    brandSoft: readonly [string, string];
    sheen: readonly [string, string];
    success: readonly [string, string];
    danger: readonly [string, string];
    surfaceDepth: readonly [string, string, string];
  };
}

export const darkTheme: ThemeDefinition = {
  scheme: 'dark',
  colors: {
    bgDefault: '#0d1117',
    bgSubtle: '#161b22',
    bgInset: '#010409',
    border: '#30363d',
    borderMuted: '#21262d',
    fgDefault: '#e6edf3',
    fgMuted: '#8b949e',
    fgSubtle: '#6e7681',
    accent: '#58a6ff',
    accentEmphasis: '#1f6feb',
    success: '#3fb950',
    successEmphasis: '#238636',
    danger: '#f85149',
    dangerEmphasis: '#da3633',
    warning: '#d29922',
    warningEmphasis: '#9e6a03',
    neutralMuted: '#6e768166',
    done: '#a371f7',
  },
  palette: {
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
  },
  glass: {
    intensity: { thin: 22, regular: 40, thick: 62, heavy: 85 },
    tint: 'dark',
    fill: {
      thin: 'rgba(255,255,255,0.04)',
      regular: 'rgba(255,255,255,0.07)',
      raised: 'rgba(255,255,255,0.10)',
    },
    border: '#ffffff1f',
    borderActive: '#ffffff3d',
  },
  gradient: {
    brand: ['#4f8dff', '#9b7bff'],
    brandSoft: ['#4f8dff33', '#9b7bff00'],
    sheen: ['#ffffff26', '#ffffff00'],
    success: ['#31e0a4', '#1fae7f'],
    danger: ['#ff6b7a', '#c9384b'],
    surfaceDepth: ['#11151f', '#0a0d14', '#05060a'],
  },
};

export const lightTheme: ThemeDefinition = {
  scheme: 'light',
  colors: {
    bgDefault: '#ffffff',
    bgSubtle: '#f6f8fa',
    bgInset: '#eef1f4',
    border: '#d0d7de',
    borderMuted: '#d8dee4',
    fgDefault: '#1f2328',
    fgMuted: '#59636e',
    fgSubtle: '#818b98',
    accent: '#0969da',
    accentEmphasis: '#0550ae',
    success: '#1a7f37',
    successEmphasis: '#116329',
    danger: '#cf222e',
    dangerEmphasis: '#a40e26',
    warning: '#9a6700',
    warningEmphasis: '#7d4e00',
    neutralMuted: '#818b9840',
    done: '#8250df',
  },
  palette: {
    space900: '#f0f2f5',
    space800: '#f6f7f9',
    space700: '#ffffff',
    space600: '#e4e7ec',
    hairline: '#0000001a',
    hairlineStrong: '#00000033',
    ink100: '#14171f',
    ink300: '#3a4150',
    ink500: '#6b7280',
    ink700: '#98a1ae',
    azure: '#2f6fed',
    azureBright: '#0b57d0',
    violet: '#7c4fe0',
    mint: '#159a6c',
    amber: '#b8720a',
    coral: '#d13c4f',
  },
  glass: {
    intensity: { thin: 30, regular: 55, thick: 75, heavy: 92 },
    tint: 'light',
    fill: {
      thin: 'rgba(0,0,0,0.025)',
      regular: 'rgba(0,0,0,0.04)',
      raised: 'rgba(0,0,0,0.06)',
    },
    border: '#0000001a',
    borderActive: '#00000033',
  },
  gradient: {
    brand: ['#2f6fed', '#7c4fe0'],
    brandSoft: ['#2f6fed26', '#7c4fe000'],
    sheen: ['#ffffffb3', '#ffffff00'],
    success: ['#159a6c', '#0e7a54'],
    danger: ['#d13c4f', '#a52c3c'],
    surfaceDepth: ['#ffffff', '#f6f7f9', '#f0f2f5'],
  },
};

export function getTheme(scheme: 'dark' | 'light'): ThemeDefinition {
  return scheme === 'light' ? lightTheme : darkTheme;
}
