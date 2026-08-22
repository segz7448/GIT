/**
 * Parses a string containing ANSI escape sequences (the color/style
 * codes real shell commands emit - e.g. `git status`, `ls --color`,
 * linters, test runners) into an array of styled text segments a
 * renderer can turn into colored <Text> runs.
 *
 * Only SGR sequences (`\x1b[...m` - the ones that set color/bold/reset)
 * are turned into styling. Everything else CSI-shaped (`\x1b[...<letter>`
 * that isn't `m` - cursor movement, clear-screen, hide-cursor, etc.) is
 * stripped rather than rendered, since a scrolling log view has no
 * meaningful way to represent "move cursor up 2 lines" the way a real
 * terminal grid does. Stripping keeps stray escape bytes from showing up
 * as garbled text instead of just disappearing cleanly.
 */

const CSI_PATTERN = /\x1b\[([0-9;]*)([a-zA-Z])/g;

// Two palettes, matching how real terminal emulators (iTerm, Windows
// Terminal, etc.) handle this: ANSI color codes are just numbers 30-37/
// 90-97, not fixed hex values - which actual color each number maps to
// is meant to depend on whether the terminal background is dark or
// light, so text stays legible either way. Using one fixed dark-tuned
// palette regardless of theme would make ANSI white text invisible on
// a light background (and ANSI black barely visible on dark).
const FG_COLORS_DARK = {
  30: '#4d4d4d', 31: '#cc4444', 32: '#44cc44', 33: '#cccc44',
  34: '#4488cc', 35: '#cc44cc', 36: '#44cccc', 37: '#cccccc',
  90: '#666666', 91: '#ff6666', 92: '#66ff66', 93: '#ffff66',
  94: '#6699ff', 95: '#ff66ff', 96: '#66ffff', 97: '#ffffff',
};

const BG_COLORS_DARK = {
  40: '#000000', 41: '#cc4444', 42: '#44cc44', 43: '#cccc44',
  44: '#4488cc', 45: '#cc44cc', 46: '#44cccc', 47: '#cccccc',
  100: '#666666', 101: '#ff6666', 102: '#66ff66', 103: '#ffff66',
  104: '#6699ff', 105: '#ff66ff', 106: '#66ffff', 107: '#ffffff',
};

// Light-background variants: darker/more saturated so text stays
// readable against a near-white terminal surface. ANSI "black" (30) and
// "bright white" (97) are the ones that would otherwise be unreadable
// if the dark palette were reused as-is.
const FG_COLORS_LIGHT = {
  30: '#1f2328', 31: '#b3261e', 32: '#1a7f37', 33: '#8a6d00',
  34: '#0969da', 35: '#a4189e', 36: '#0f7f88', 37: '#3a4150',
  90: '#59636e', 91: '#d1383a', 92: '#2a9d4e', 93: '#a68300',
  94: '#2f6fed', 95: '#c23bc0', 96: '#159a9e', 97: '#14171f',
};

const BG_COLORS_LIGHT = {
  40: '#e4e7ec', 41: '#f4c9c7', 42: '#c7f0d3', 43: '#f3ecc0',
  44: '#c9dcf7', 45: '#f2c9ef', 46: '#c3f0f0', 47: '#dfe3e8',
  100: '#c7cdd6', 101: '#f0b0af', 102: '#a9edbd', 103: '#f0e2a0',
  104: '#a9c6f5', 105: '#f0aeec', 106: '#a3ecec', 107: '#f5f6f8',
};

function freshStyle() {
  return { color: null, backgroundColor: null, bold: false, dim: false };
}

/**
 * Returns an array of { text, color, backgroundColor, bold, dim }.
 * `color`/`backgroundColor` are null when unset (renderer should fall
 * back to its own default text color).
 *
 * `scheme` selects which ANSI palette to render with ('dark' | 'light',
 * defaults to 'dark') - pass the app's current resolved theme scheme so
 * output stays legible against the terminal's actual background color.
 */
export function parseAnsi(input, scheme = 'dark') {
  if (!input) return [];

  const fgColors = scheme === 'light' ? FG_COLORS_LIGHT : FG_COLORS_DARK;
  const bgColors = scheme === 'light' ? BG_COLORS_LIGHT : BG_COLORS_DARK;

  const segments = [];
  let style = freshStyle();
  let lastIndex = 0;
  let match;

  CSI_PATTERN.lastIndex = 0;
  while ((match = CSI_PATTERN.exec(input)) !== null) {
    const plainText = input.slice(lastIndex, match.index);
    if (plainText) {
      segments.push({ text: plainText, ...style });
    }

    const [, paramsStr, letter] = match;
    if (letter === 'm') {
      const params = paramsStr.length ? paramsStr.split(';').map((p) => parseInt(p, 10)) : [0];
      style = applySgrParams(style, params, fgColors, bgColors);
    }

    lastIndex = CSI_PATTERN.lastIndex;
  }

  const remaining = input.slice(lastIndex);
  if (remaining) {
    segments.push({ text: remaining, ...style });
  }

  return segments;
}

function applySgrParams(currentStyle, params, fgColors, bgColors) {
  let style = { ...currentStyle };
  for (const code of params) {
    if (code === 0) {
      style = freshStyle();
    } else if (code === 1) {
      style.bold = true;
    } else if (code === 2) {
      style.dim = true;
    } else if (code === 22) {
      style.bold = false;
      style.dim = false;
    } else if (code === 39) {
      style.color = null;
    } else if (code === 49) {
      style.backgroundColor = null;
    } else if (fgColors[code]) {
      style.color = fgColors[code];
    } else if (bgColors[code]) {
      style.backgroundColor = bgColors[code];
    }
  }
  return style;
}

/**
 * Strips all ANSI/CSI escape sequences without extracting styling -
 * useful anywhere plain text is needed (e.g. copying output, or a
 * plain-text fallback render).
 */
export function stripAnsi(input) {
  if (!input) return '';
  return input.replace(CSI_PATTERN, '');
}
