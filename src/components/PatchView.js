import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

/**
 * Renders a raw unified-diff `patch` string exactly as GitHub's
 * /pulls/{number}/files endpoint returns it - this is already a diff, so
 * unlike DiffView (which computes a diff from two full texts), this just
 * colors the existing +/- lines.
 */
export default function PatchView({ patch, style }) {
  const { colors, scheme } = useTheme();
  const addedText = scheme === 'light' ? '#1a7f37' : '#7ee787';
  const removedText = scheme === 'light' ? '#cf222e' : '#ffa198';

  const styles = StyleSheet.create({
    container: { backgroundColor: colors.bgInset },
    binaryText: { color: colors.fgSubtle, padding: spacing.md, fontStyle: 'italic', fontSize: typography.sizeSm },
    row: { paddingHorizontal: spacing.sm },
    rowAdded: { backgroundColor: scheme === 'light' ? 'rgba(26,127,55,0.12)' : 'rgba(63,185,80,0.15)' },
    rowRemoved: { backgroundColor: scheme === 'light' ? 'rgba(207,34,46,0.1)' : 'rgba(248,81,73,0.15)' },
    rowHunk: { backgroundColor: scheme === 'light' ? 'rgba(9,105,218,0.08)' : 'rgba(88,166,255,0.1)' },
    lineText: {
      color: colors.fgDefault,
      fontFamily: typography.mono,
      fontSize: 12,
      lineHeight: 18,
    },
    lineTextAdded: { color: addedText },
    lineTextRemoved: { color: removedText },
    lineTextHunk: { color: colors.accent },
  });

  if (!patch) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.binaryText}>
          No text diff available (binary file, or the file is too large to diff).
        </Text>
      </View>
    );
  }

  const lines = patch.split('\n');

  return (
    <ScrollView style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {lines.map((line, idx) => {
            const isAdded = line.startsWith('+') && !line.startsWith('+++');
            const isRemoved = line.startsWith('-') && !line.startsWith('---');
            const isHunkHeader = line.startsWith('@@');
            return (
              <View
                key={idx}
                style={[
                  styles.row,
                  isAdded && styles.rowAdded,
                  isRemoved && styles.rowRemoved,
                  isHunkHeader && styles.rowHunk,
                ]}
              >
                <Text
                  style={[
                    styles.lineText,
                    isAdded && styles.lineTextAdded,
                    isRemoved && styles.lineTextRemoved,
                    isHunkHeader && styles.lineTextHunk,
                  ]}
                >
                  {line || ' '}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
}
