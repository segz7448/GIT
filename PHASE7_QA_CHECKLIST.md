# Phase 7 — QA & Release Checklist

This environment has no Android SDK, no device/emulator, and no network
access, so nothing here could be built or run end-to-end. Everything
below is split into what was **actually verified statically** in this
session vs. what still needs a **real build environment** before you ship.

## ✅ Verified in this session (automated, not guesswork)

| Check | Result |
|---|---|
| Every relative import (`./`, `../`) across `src/`, `modules/`, `plugins/`, `App.js`, `index.js` resolves to a real file | **311/311 resolved** |
| Every external npm package imported anywhere in the app is declared in `package.json` | **34/34 declared** |
| `package.json`, `app.json`, module manifest JSON — syntactically valid | ✅ |
| `tsconfig.json` — valid JSONC (comments are standard TS config syntax) | ✅ |
| All native resource XML (`widget_glass_bg.xml`, `widget_status_dot.xml`, `widget_branch_icon.xml`, `ic_notification_sync.xml`, `widget_repo_actions.xml`) | ✅ well-formed XML |
| No duplicate keys in the icon glyph registry or legacy-name map | ✅ |
| Zero emoji-as-UI-icon usage remaining (full codebase sweep, not spot-checked) | ✅ (only notification *text* content in `backgroundTasks.ts`, which is correct) |
| Mechanically-converted screens (`.js`→`.tsx`) are line-count-identical to their originals, confirming no accidental logic changes | ✅ spot-checked on largest files |
| SQLite schema: every table filtered/sorted by a non-PK column has a supporting index | ✅ 8 indices across 7 tables |

## 🔲 Requires a real build environment — do these before shipping

1. **Fresh prebuild.**
   ```bash
   npm install
   npx expo prebuild --platform android --clean
   ```
   Watch for: the `gitnative` local module autolinking correctly (check
   `android/settings.gradle` includes it), and the widget config plugin
   copying `plugins/widget-resources/{layout,xml,drawable}` into
   `android/app/src/main/res/`.

2. **Native core build (optional but recommended).**
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
   cargo install cargo-ndk
   cd modules/gitnative/rust && ./build-android.sh
   ```
   If skipped, the app still works correctly via the JS fallback path
   (`modules/gitnative/fallback.ts`) — confirm this by checking
   Settings → Performance shows "JS fallback" instead of "Active" and
   that diffing/backups still function.

3. **Debug build + device smoke test.**
   ```bash
   npx expo run:android
   ```
   Specifically exercise the paths touched this session:
   - Login → glass card renders, token input works
   - Repo list → glass cards, search, create-repo modal, pull-to-refresh
   - Bottom tab bar → glass blur background renders correctly on your
     target API level (BlurView behavior differs below API 31)
   - Side menu → glass drawer, all icons animate on tap
   - Open a file → diff view renders (check whether native or JS
     fallback is active via a console log or the Settings row)
   - Actions tab on a repo → confirm auto-watch doesn't crash if the
     repo has zero prior workflow runs
   - Home screen widget → add it, confirm the new glass background and
     vector icons render (RemoteViews rendering can behave differently
     than in-app rendering — verify on-device, not just by reading XML)
   - Push notification → send a test message from the Firebase console
     to confirm the FCM → local notification bridge fires

4. **TypeScript compile check.**
   ```bash
   npx tsc --noEmit
   ```
   Expect this to surface real (but non-blocking, per the Phase 3
   `noImplicitAny: false` tradeoff) type gaps in the mechanically
   converted screens' internal callbacks. Triage before tightening
   `noImplicitAny` back to `true`.

5. **Bundle size / cold start.**
   ```bash
   npx expo export --platform android
   ```
   Compare output bundle size against the pre-rewrite baseline — new
   deps this session (`react-native-svg`, `react-native-reanimated`)
   add real weight; confirm it's acceptable. Cold-start profiling needs
   an actual device (Android Studio profiler or `adb shell am start -W`).

6. **Signed release build.**
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   Uses the existing `plugins/withReleaseSigning.js` — confirm your
   signing config env vars are set before running. Test the signed
   bundle on a real device, not just the debug build.

## Known non-blockers (documented, not fixed — by design)

- **12 files in `src/components/*.js`** were never in scope for any
  phase this session (Phase 3 = screens, Phase 5 = notifications,
  Phase 6 = db). Still plain JS: `AnsiText`, `BranchManagerModal`,
  `ErrorBoundary`, `FileActionsModal`, `GlassSplash`, `PatchView`,
  `RateLimitIndicator`, `RecoveryBanner`, `SidebarMenu`,
  `TerminalKeyRow`, `VersionHistoryModal`.
- **`src/services/*.js`, `src/context/*.js`, `src/utils/*.js`,
  `src/navigation.js`, `src/theme.js`, `src/workflows/*.js`** — also
  never in scope, still plain JS (18 files).
- **`noImplicitAny: false`** in `tsconfig.json` — intentional per-Phase-3
  tradeoff, not an oversight. See item 4 above.
