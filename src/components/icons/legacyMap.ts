import { ICON_MAP } from './glyphs';

/**
 * Resolves whatever a call site passes as an `icon`/`name` prop into
 * something PremiumIcon can render. Two valid input shapes:
 *
 *  1. One of our semantic keys (`"repo"`, `"settingsGear"`, ...) - looked
 *     up in ICON_MAP for its outline/filled Ionicons pair.
 *  2. A raw Ionicons glyph name (`"cloud-offline-outline"`,
 *     `"git-pull-request-outline"`, ...) - these are real, valid Ionicons
 *     names already (several screens have always passed literal Ionicons
 *     names directly), so PremiumIcon renders them as-is.
 *
 * This function's only real job is filling in a safe default when
 * nothing was passed at all, so a missing icon prop never renders blank.
 */
export function resolveGlyphName(name: string | undefined): string {
  if (!name) return 'ellipse-outline';
  return name;
}

export { ICON_MAP };
