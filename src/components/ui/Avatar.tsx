import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../../theme/tokens';

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({ uri, name = '', size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials =
    name
      .split(/[\s-_]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?';

  if (!uri || failed) {
    return (
      <LinearGradient
        colors={gradient.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri }}
      placeholder={{ blurhash: BLURHASH }}
      transition={200}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: 'rgba(255,255,255,0.06)' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
});
