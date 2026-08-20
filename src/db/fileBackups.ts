import { withDb } from './database';
import { hashBlob } from '../../modules/gitnative';

/**
 * Local file backup system.
 *
 * Workflow (matches the requested design):
 *  1. User opens a file -> createBackup(..., 'open') stores a hidden
 *     pre-edit snapshot ("open" kind), skipped if an identical one
 *     already exists for this exact content (avoids duplicate no-op
 *     backups every time the same unmodified file is reopened).
 *  2. User edits and saves/commits -> createBackup(..., 'save') stores
 *     another timestamped snapshot ("save" kind).
 *  3. Backups are kept for 30 days (pruned lazily on app start and
 *     whenever a new backup is created) or until manually deleted.
 *  4. restorePreviousVersion() lets the user pick any prior snapshot and
 *     get its content back into the editor without touching GitHub.
 *
 * Snapshots are content-addressed by (owner, repo, branch, path,
 * created_at) so multiple versions of the same file coexist and can be
 * browsed as a local version history, independent of Git history.
 */

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type BackupKind = 'open' | 'save';

export interface FileBackup {
  id: string;
  owner: string;
  repo: string;
  branch: string | null;
  path: string;
  content: string;
  contentHash: string | null;
  sourceSha: string | null;
  kind: BackupKind;
  createdAt: number;
}

function genId(): string {
  return `bak-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createBackup(
  owner: string,
  repo: string,
  branch: string | null | undefined,
  path: string,
  content: string,
  sourceSha: string | null | undefined,
  kind: BackupKind
): Promise<string | null> {
  const db = await withDb();
  const contentHash = await hashBlob(toBase64(content));

  // Skip creating a duplicate "open" backup if the most recent backup for
  // this path already has identical content - avoids filling the table
  // with redundant snapshots every time someone opens the same file
  // without editing it. Compared by content_hash (fixed-length, native-
  // accelerated) rather than the full text column, which matters once
  // files get into the hundreds-of-KB range.
  if (kind === 'open') {
    const latest = await db.getFirstAsync<{ content_hash: string | null }>(
      `SELECT content_hash FROM file_backups WHERE owner = ? AND repo = ? AND branch = ? AND path = ?
       ORDER BY created_at DESC LIMIT 1`,
      [owner, repo, branch || '', path]
    );
    if (latest && latest.content_hash === contentHash) return null;
  }

  const id = genId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO file_backups (id, owner, repo, branch, path, content, content_hash, source_sha, kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, owner, repo, branch || '', path, content, contentHash, sourceSha || null, kind, now]
  );

  // Opportunistic pruning - cheap enough to run on every backup write,
  // keeps the table from growing unbounded over long-term use.
  await db.runAsync(`DELETE FROM file_backups WHERE created_at < ?`, [now - RETENTION_MS]);

  return id;
}

function toBase64(str: string | null | undefined): string {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(str ?? '', 'utf-8').toString('base64')
    : globalThis.btoa(unescape(encodeURIComponent(str ?? '')));
}

export async function listBackups(
  owner: string,
  repo: string,
  branch: string | null | undefined,
  path: string
): Promise<FileBackup[]> {
  const db = await withDb();
  const rows = await db.getAllAsync<RawBackupRow>(
    `SELECT * FROM file_backups WHERE owner = ? AND repo = ? AND branch = ? AND path = ?
     ORDER BY created_at DESC`,
    [owner, repo, branch || '', path]
  );
  return rows.map(mapRow);
}

export async function getBackup(id: string): Promise<FileBackup | null> {
  const db = await withDb();
  const row = await db.getFirstAsync<RawBackupRow>(`SELECT * FROM file_backups WHERE id = ?`, [id]);
  return row ? mapRow(row) : null;
}

export async function deleteBackup(id: string): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM file_backups WHERE id = ?`, [id]);
}

export async function pruneExpiredBackups(): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM file_backups WHERE created_at < ?`, [Date.now() - RETENTION_MS]);
}

interface RawBackupRow {
  id: string;
  owner: string;
  repo: string;
  branch: string | null;
  path: string;
  content: string;
  content_hash: string | null;
  source_sha: string | null;
  kind: BackupKind;
  created_at: number;
}

function mapRow(row: RawBackupRow): FileBackup {
  return {
    id: row.id,
    owner: row.owner,
    repo: row.repo,
    branch: row.branch || null,
    path: row.path,
    content: row.content,
    contentHash: row.content_hash || null,
    sourceSha: row.source_sha,
    kind: row.kind,
    createdAt: row.created_at,
  };
}
