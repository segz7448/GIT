import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getOrFetchFileMeta } from '../db/fileMetaCache';
import { colors, spacing, typography } from '../theme';
import { palette } from '../theme/tokens';
import PremiumIcon from './icons/PremiumIcon';

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatModified(ts?: number | null): { relative: string; full: string } | null {
  if (!ts) return null;
  const now = Date.now();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const d = new Date(ts);
  const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  let relative: string;
  if (diffMin < 1) relative = 'just now';
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHr < 24) relative = `${diffHr}h ago`;
  else if (diffDay < 30) relative = `${diffDay}d ago`;
  else relative = datePart;

  return { relative, full: `${datePart} ${timePart}` };
}

export interface FileRowProps {
  item: { type: 'dir' | 'file'; name: string; path: string; size?: number };
  owner: string;
  repo: string;
  branch?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * A single row in a repo file/folder listing. Fetches and caches the
 * last-modified date for its path lazily (only while visible, not for
 * the whole directory up front) to avoid a burst of GitHub API calls
 * when opening a large folder.
 */
export default function FileRow({ item, owner, repo, branch, onPress, onLongPress }: FileRowProps) {
  const [modified, setModified] = useState<{ relative: string; full: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrFetchFileMeta(owner, repo, branch, item.path).then((meta: any) => {
      if (!cancelled && meta && meta.lastModified) {
        setModified(formatModified(meta.lastModified));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [owner, repo, branch, item.path]);

  const isDir = item.type === 'dir';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <PremiumIcon
        name={isDir ? 'folder' : 'file'}
        size={18}
        color={isDir ? palette.azureBright : palette.ink500}
        style={styles.icon}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {modified && (
          <Text style={styles.modified} numberOfLines={1}>
            Modified {modified.relative}
          </Text>
        )}
      </View>
      {item.type === 'file' && <Text style={styles.size}>{formatBytes(item.size)}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.borderMuted,
    borderBottomWidth: 1,
  },
  icon: { marginRight: spacing.sm },
  info: { flex: 1 },
  name: { color: colors.fgDefault, fontFamily: typography.mono, fontSize: typography.sizeSm },
  modified: { color: colors.fgSubtle, fontSize: typography.sizeXs || 11, marginTop: 2 },
  size: { color: colors.fgSubtle, fontSize: typography.sizeSm, marginLeft: spacing.sm },
});
