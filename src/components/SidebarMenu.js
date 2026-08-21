import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { navigate } from '../navigation';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import PremiumIcon from './icons/PremiumIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

const MENU_ITEMS = [
  { key: 'profile', label: 'Profile', icon: 'profile' },
  { key: 'terminal', label: 'Terminal', icon: 'terminal' },
  { key: 'codespaces', label: 'Codespaces', icon: 'actionsPlay' },
  { key: 'issues', label: 'Issues', icon: 'issue' },
  { key: 'activity', label: 'Recent Activity', icon: 'activity' },
  { key: 'widget', label: 'Home Screen Widget', icon: 'widget' },
  { key: 'settings', label: 'Settings', icon: 'settingsGear' },
];

export default function SidebarMenu() {
  const { isOpen, close } = useSidebar();
  const { username, logout } = useAuth();
  const { scheme, palette, gradient, glass, radius } = useTheme();
  const [activeKey, setActiveKey] = useState(null);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleNavigate = (key) => {
    setActiveKey(key);
    close();
    switch (key) {
      case 'profile':
        navigate('Profile');
        break;
      case 'terminal':
        navigate('MainTabs', { screen: 'Terminal' });
        break;
      case 'codespaces':
        navigate('MainTabs', { screen: 'Codespaces' });
        break;
      case 'issues':
        navigate('Issues');
        break;
      case 'activity':
        navigate('Activity');
        break;
      case 'widget':
        navigate('WidgetSettings');
        break;
      case 'settings':
        navigate('MainTabs', { screen: 'Settings' });
        break;
    }
  };

  const handleLogout = () => {
    close();
    Alert.alert('Disconnect account', 'Remove the stored token from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { width: DRAWER_WIDTH, borderRightColor: glass.border },
          { transform: [{ translateX }] },
        ]}
      >
        <BlurView intensity={glass.intensity.thick} tint={scheme === 'light' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={gradient.surfaceDepth}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={[styles.header, { borderBottomColor: glass.border }]}>
          <LinearGradient colors={gradient.brand} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{(username || '?').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={[styles.username, { color: palette.ink100 }]}>{username || 'Not signed in'}</Text>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.menuItem,
                  { borderRadius: radius.md },
                  isActive && {
                    backgroundColor: palette.azure + '24',
                    borderWidth: 1,
                    borderColor: palette.azureBright + '59',
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleNavigate(item.key)}
              >
                <PremiumIcon name={item.icon} active={isActive} size={19} style={styles.menuIconSlot} />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: palette.ink300 },
                    isActive && { color: palette.ink100, fontWeight: '600' },
                  ]}
                >
                  {item.label}
                </Text>
                <PremiumIcon name="chevronRight" size={15} color={palette.ink700} style={styles.menuChevron} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.footer, { borderTopColor: glass.border }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.75}>
            <PremiumIcon name="logout" size={18} color={palette.coral} />
            <Text style={[styles.logoutText, { color: palette.coral }]}>Disconnect / Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    overflow: 'hidden',
    borderRightWidth: 1,
    zIndex: 20,
    paddingTop: 50,
  },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  username: { fontSize: typography.sizeLg, fontWeight: '600' },
  menuList: { flex: 1, paddingTop: spacing.md, paddingHorizontal: spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    marginBottom: 2,
  },
  menuIconSlot: { width: 30 },
  menuLabel: { flex: 1, fontSize: typography.sizeMd },
  menuChevron: { opacity: 0.6 },
  footer: { padding: spacing.lg, borderTopWidth: 1 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  logoutText: { fontWeight: '600', fontSize: typography.sizeMd },
});
