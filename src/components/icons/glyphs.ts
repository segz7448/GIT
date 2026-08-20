/**
 * Semantic icon registry, backed by real Expo icons (@expo/vector-icons
 * Ionicons) - not hand-drawn substitutes, not emoji.
 *
 * Every entry maps a semantic name used across the app (`repo`,
 * `settingsGear`, `chevronRight`, ...) to a real Ionicons glyph pair:
 * an `outline` variant shown at rest, and a `filled` variant swapped in
 * when the icon is `active` (bottom tab selected, side-menu item
 * current, toggle on). That outline→filled swap on selection is the
 * premium part - a plain static icon doesn't do that.
 *
 * Where Ionicons has no distinct filled counterpart, `filled` just
 * repeats `outline` and PremiumIcon still animates color instead.
 */

export interface IconEntry {
  outline: string;
  filled: string;
}

export const ICON_MAP: Record<string, IconEntry> = {
  home: { outline: 'home-outline', filled: 'home' },
  repo: { outline: 'book-outline', filled: 'book' },
  pullRequest: { outline: 'git-pull-request-outline', filled: 'git-pull-request' },
  actionsPlay: { outline: 'play-circle-outline', filled: 'play-circle' },
  terminal: { outline: 'terminal-outline', filled: 'terminal' },
  settingsGear: { outline: 'settings-outline', filled: 'settings' },
  profile: { outline: 'person-circle-outline', filled: 'person-circle' },
  activity: { outline: 'pulse-outline', filled: 'pulse' },
  issue: { outline: 'alert-circle-outline', filled: 'alert-circle' },
  release: { outline: 'pricetag-outline', filled: 'pricetag' },
  security: { outline: 'shield-checkmark-outline', filled: 'shield-checkmark' },
  menu: { outline: 'menu-outline', filled: 'menu' },
  close: { outline: 'close-outline', filled: 'close' },
  chevronRight: { outline: 'chevron-forward-outline', filled: 'chevron-forward' },
  chevronDown: { outline: 'chevron-down-outline', filled: 'chevron-down' },
  search: { outline: 'search-outline', filled: 'search' },
  plus: { outline: 'add-outline', filled: 'add' },
  sync: { outline: 'sync-outline', filled: 'sync' },
  star: { outline: 'star-outline', filled: 'star' },
  branch: { outline: 'git-branch-outline', filled: 'git-branch' },
  commit: { outline: 'git-commit-outline', filled: 'git-commit' },
  bell: { outline: 'notifications-outline', filled: 'notifications' },
  bellOff: { outline: 'notifications-off-outline', filled: 'notifications-off' },
  logout: { outline: 'log-out-outline', filled: 'log-out' },
  widget: { outline: 'grid-outline', filled: 'grid' },
  checkmark: { outline: 'checkmark', filled: 'checkmark' },
  folder: { outline: 'folder-outline', filled: 'folder' },
  file: { outline: 'document-outline', filled: 'document' },
  mail: { outline: 'mail-outline', filled: 'mail' },
  building: { outline: 'business-outline', filled: 'business' },
  pin: { outline: 'location-outline', filled: 'location' },
  link: { outline: 'link-outline', filled: 'link' },
  warning: { outline: 'warning-outline', filled: 'warning' },
  tray: { outline: 'file-tray-outline', filled: 'file-tray' },
  code: { outline: 'code-slash-outline', filled: 'code-slash' },
  cloudOff: { outline: 'cloud-offline-outline', filled: 'cloud-offline' },
  arrowForwardCircle: { outline: 'arrow-forward-circle-outline', filled: 'arrow-forward-circle' },
  addCircle: { outline: 'add-circle-outline', filled: 'add-circle' },
  key: { outline: 'key-outline', filled: 'key' },
  external: { outline: 'open-outline', filled: 'open' },
};

export type GlyphName = keyof typeof ICON_MAP;
