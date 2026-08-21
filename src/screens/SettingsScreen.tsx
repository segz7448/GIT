import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { spacing, typography } from '../theme';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { Screen, Card, Button, Avatar, SectionLabel, Badge } from '../components/ui';
import PremiumIcon from '../components/icons/PremiumIcon';
import { haptic } from '../utils/haptics';
import { isNativeAccelAvailable } from '../../modules/gitnative';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'system', label: 'System', icon: 'themeSystem' },
  { mode: 'dark', label: 'Dark', icon: 'themeDark' },
  { mode: 'light', label: 'Light', icon: 'themeLight' },
];

// Push notifications are fully automatic now (see App.js — enabled silently
// on launch, no user-facing toggle) so there is intentionally no
// Notifications section here anymore.
export default function SettingsScreen({ navigation }: any) {
  const { username, logout } = useAuth();
  const { colors, palette, glass, radius, mode, setMode, scheme } = useTheme();
  const nativeAccel = isNativeAccelAvailable();

  const handleLogout = () => {
    Alert.alert('Disconnect account', 'Remove the stored token from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Card level="md" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={username || '?'} size={52} />
            <View style={styles.profileText}>
              <SectionLabel style={styles.noMargin}>Signed in as</SectionLabel>
              <Text style={[styles.username, { color: colors.fgDefault }]}>{username || 'unknown'}</Text>
            </View>
          </View>
        </Card>

        <SectionLabel style={styles.sectionSpacing}>Appearance</SectionLabel>
        <Card level="none" inset style={styles.rowCard}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const selected = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => {
                    haptic.select();
                    setMode(opt.mode);
                  }}
                  style={[
                    styles.themeChip,
                    { borderColor: glass.border, borderRadius: radius.md },
                    selected && {
                      backgroundColor: palette.azure + '24',
                      borderColor: palette.azureBright + '80',
                    },
                  ]}
                >
                  <PremiumIcon name={opt.icon} active={selected} size={20} />
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: colors.fgMuted },
                      selected && { color: colors.fgDefault, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.themeHint, { color: colors.fgSubtle }]}>
            {mode === 'system'
              ? `Following your device setting - currently ${scheme}.`
              : `Always ${mode}, regardless of your device setting.`}
          </Text>
        </Card>

        <SectionLabel>Account</SectionLabel>
        <Card onPress={() => navigation.navigate('Security')} style={styles.rowCard}>
          <View style={styles.row}>
            <PremiumIcon name="security" size={18} color={colors.fgMuted} />
            <Text style={[styles.rowText, { color: colors.fgDefault }]}>
              Security · token expiration, scopes, accounts
            </Text>
            <PremiumIcon name="chevronRight" size={18} color={colors.fgSubtle} />
          </View>
        </Card>

        <SectionLabel>Performance</SectionLabel>
        <Card level="none" inset style={styles.rowCard}>
          <View style={styles.row}>
            <PremiumIcon name="sync" size={18} color={colors.fgMuted} />
            <Text style={[styles.rowText, { color: colors.fgDefault }]}>Native acceleration (hashing / diffing)</Text>
            <Badge label={nativeAccel ? 'Active' : 'JS fallback'} tone={nativeAccel ? 'success' : 'neutral'} small />
          </View>
        </Card>

        <Button
          title="Disconnect account"
          onPress={handleLogout}
          variant="danger"
          icon="logout"
          fullWidth
          hapticStyle="warning"
          style={styles.logoutButton}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.fgSubtle }]}>GIT · Personal build tool</Text>
          <Text style={[styles.footerSubtext, { color: colors.fgSubtle }]}>
            All requests go directly from this device to api.github.com. No third-party servers involved.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  profileCard: { marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileText: { marginLeft: spacing.md },
  noMargin: { marginBottom: 2 },
  username: { fontSize: typography.sizeLg, fontWeight: '700' },
  sectionSpacing: { marginTop: spacing.xs },
  rowCard: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { fontSize: typography.sizeSm, flex: 1 },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  themeChipText: { fontSize: typography.sizeSm, fontWeight: '600' },
  themeHint: { fontSize: typography.sizeSm, marginTop: spacing.md },
  logoutButton: { marginBottom: spacing.xl },
  footer: { alignItems: 'center' },
  footerText: { fontSize: typography.sizeSm },
  footerSubtext: { fontSize: typography.sizeSm, textAlign: 'center', marginTop: spacing.xs, lineHeight: 16 },
});
