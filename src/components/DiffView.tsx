import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { diffLines as jsDiffLinesLib } from 'diff';
import { spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { diffLines as nativeDiffLines, isNativeAccelAvailable, DiffHunk } from '../../modules/gitnative';

type Row = { key: string; text: string; type: 'added' | 'removed' | 'context' };

export interface DiffViewProps {
  oldText?: string;
  newText?: string;
  style?: ViewStyle;
}

function splitLines(text: string): string[] {
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Reconstruct renderable rows from the {aStart,aLen,bStart,bLen} hunks
 * the native/fallback diff engines return — they carry line *ranges*,
 * not content, so content comes back from the original line arrays. */
function hunksToRows(aLines: string[], bLines: string[], hunks: DiffHunk[]): Row[] {
  const rows: Row[] = [];
  let ai = 0;
  let bi = 0;
  let k = 0;

  for (const h of hunks) {
    while (ai < h.aStart && bi < h.bStart) {
      rows.push({ key: `ctx-${k++}`, text: aLines[ai], type: 'context' });
      ai++;
      bi++;
    }
    for (let i = 0; i < h.aLen; i++) {
      rows.push({ key: `rm-${k++}`, text: aLines[h.aStart + i], type: 'removed' });
    }
    ai = h.aStart + h.aLen;
    for (let i = 0; i < h.bLen; i++) {
      rows.push({ key: `add-${k++}`, text: bLines[h.bStart + i], type: 'added' });
    }
    bi = h.bStart + h.bLen;
  }
  while (ai < aLines.length && bi < bLines.length) {
    rows.push({ key: `ctx-${k++}`, text: aLines[ai], type: 'context' });
    ai++;
    bi++;
  }
  return rows;
}

/** JS-only path via the `diff` package directly — used when neither the
 * native module nor its own JS fallback produced a usable result. Kept
 * as a last-resort so the diff view never renders blank. */
function jsFallbackRows(oldText: string, newText: string): Row[] {
  const parts = jsDiffLinesLib(oldText, newText);
  const rows: Row[] = [];
  let k = 0;
  for (const part of parts) {
    const lines = splitLines(part.value);
    for (const line of lines) {
      rows.push({
        key: `j-${k++}`,
        text: line,
        type: part.added ? 'added' : part.removed ? 'removed' : 'context',
      });
    }
  }
  return rows;
}

/**
 * Renders a unified line diff between two strings, GitHub-style.
 *
 * Uses the native Kotlin -> C++ JNI -> Rust diff engine
 * (`modules/gitnative`) when available for large-file responsiveness,
 * transparently falling back to the pure-JS `diff` package otherwise —
 * the rendered output is identical either way.
 */
export default function DiffView({ oldText, newText, style }: DiffViewProps) {
  const { palette, glass, scheme } = useTheme();
  const [rows, setRows] = useState<Row[] | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const a = oldText || '';
    const b = newText || '';

    (async () => {
      try {
        const hunks = await nativeDiffLines(a, b);
        if (requestId.current !== id) return;
        setRows(hunksToRows(splitLines(a), splitLines(b), hunks));
      } catch {
        if (requestId.current !== id) return;
        setRows(jsFallbackRows(a, b));
      }
    })();
  }, [oldText, newText]);

  const addedBg = scheme === 'light' ? 'rgba(26,127,55,0.12)' : 'rgba(49,224,164,0.15)';
  const removedBg = scheme === 'light' ? 'rgba(207,34,46,0.1)' : 'rgba(255,107,122,0.15)';

  const styles = StyleSheet.create({
    container: { backgroundColor: glass.fill.thin },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
    row: { flexDirection: 'row', paddingHorizontal: spacing.sm },
    rowAdded: { backgroundColor: addedBg },
    rowRemoved: { backgroundColor: removedBg },
    gutter: {
      width: 16,
      color: palette.ink500,
      fontFamily: typography.mono,
      fontSize: 12,
    },
    lineText: {
      color: palette.ink300,
      fontFamily: typography.mono,
      fontSize: 12,
      lineHeight: 18,
    },
    lineTextAdded: { color: palette.mint },
    lineTextRemoved: { color: palette.coral },
    noChangesText: { color: palette.ink500, padding: spacing.md, fontStyle: 'italic' },
  });

  if (rows === null) {
    return (
      <View style={[styles.container, styles.loading, style]}>
        <ActivityIndicator color={palette.azureBright} size="small" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} horizontal={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {rows.map((row) => (
            <View
              key={row.key}
              style={[styles.row, row.type === 'added' && styles.rowAdded, row.type === 'removed' && styles.rowRemoved]}
            >
              <Text style={styles.gutter}>{row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}</Text>
              <Text
                style={[
                  styles.lineText,
                  row.type === 'added' && styles.lineTextAdded,
                  row.type === 'removed' && styles.lineTextRemoved,
                ]}
              >
                {row.text || ' '}
              </Text>
            </View>
          ))}
          {rows.length === 0 && <Text style={styles.noChangesText}>No changes</Text>}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

/** Exposed for the settings/debug screen so users can see whether the
 * native accelerator actually linked on their build. */
export { isNativeAccelAvailable };
