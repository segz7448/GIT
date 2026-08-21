import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { spacing, typography } from '../theme';
import { palette, gradient, glass, radius } from '../theme/tokens';
import { Screen, Input, Button } from '../components/ui';
import PremiumIcon from '../components/icons/PremiumIcon';

export default function LoginScreen() {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  const handleLogin = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      Alert.alert('Missing token', 'Paste your GitHub Personal Access Token to continue.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmed);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Could not verify this token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            <View style={styles.brandRow}>
              <LinearGradient
                colors={gradient.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <PremiumIcon name="branch" size={30} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>GIT</Text>
              <Text style={styles.subtitle}>Your personal GitHub control panel</Text>
            </View>

            <BlurView intensity={glass.intensity.thick} tint="dark" style={styles.card}>
              <LinearGradient
                colors={gradient.sheen}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.label}>Personal access token</Text>
              <Input
                icon="key"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                mono
                style={styles.input}
              />

              <Button
                title="Connect"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                icon="arrowForwardCircle"
                iconPosition="right"
                hapticStyle="success"
                style={styles.connectButton}
              />

              <Button
                title="Generate a fine-grained token"
                variant="ghost"
                size="sm"
                icon="external"
                iconPosition="right"
                onPress={() => Linking.openURL('https://github.com/settings/tokens?type=beta')}
                style={styles.linkButton}
              />

              <View style={styles.hintRow}>
                <PremiumIcon name="security" size={14} color={palette.ink500} style={styles.hintIcon} />
                <Text style={styles.hint}>
                  Required scopes: repo, workflow, read:user. Stored only on this device in
                  encrypted storage — never transmitted anywhere except directly to api.github.com.
                </Text>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brandRow: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: { color: palette.ink100, fontSize: typography.sizeXxl, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: palette.ink500, fontSize: typography.sizeMd, marginTop: spacing.xs },
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
  },
  label: {
    color: palette.ink500,
    fontSize: typography.sizeSm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  input: { marginBottom: spacing.lg },
  connectButton: { marginTop: spacing.xs },
  linkButton: { alignSelf: 'center', marginTop: spacing.md },
  hintRow: { flexDirection: 'row', marginTop: spacing.lg, alignItems: 'flex-start', gap: spacing.xs },
  hint: { color: palette.ink500, fontSize: typography.sizeSm, lineHeight: 18, flex: 1 },
  hintIcon: { marginTop: 2 },
});
