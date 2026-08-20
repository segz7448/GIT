import { withDb } from './database';

/**
 * Crash-recovery journal.
 *
 * Any operation that can take a while and matters if interrupted
 * (zip extraction + commit, artifact download + extraction, bulk file
 * imports) writes a row here BEFORE starting, updates its progress as
 * it goes, and deletes the row when it finishes cleanly.
 *
 * On next app launch, `getRecoverableEntries()` lets a screen offer:
 * "Your last ZIP upload to owner/repo didn't finish. Resume / Discard?"
 */

export type JournalKind = 'zip_upload' | 'artifact_download' | 'bulk_commit';
export type JournalStatus = 'in_progress' | 'failed' | 'done';

export interface JournalEntry {
  id: string;
  kind: JournalKind;
  status: JournalStatus;
  payload: Record<string, unknown> | null;
  progress: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function startJournalEntry(kind: JournalKind, payload: Record<string, unknown>): Promise<string> {
  const db = await withDb();
  const id = genId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO session_journal (id, kind, status, payload, progress, created_at, updated_at)
     VALUES (?, ?, 'in_progress', ?, ?, ?, ?)`,
    [id, kind, JSON.stringify(payload), JSON.stringify({}), now, now]
  );
  return id;
}

export async function updateJournalProgress(id: string, progress: Record<string, unknown>): Promise<void> {
  const db = await withDb();
  await db.runAsync(`UPDATE session_journal SET progress = ?, updated_at = ? WHERE id = ?`, [
    JSON.stringify(progress),
    Date.now(),
    id,
  ]);
}

export async function completeJournalEntry(id: string): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM session_journal WHERE id = ?`, [id]);
}

export async function failJournalEntry(id: string, errorMessage: string): Promise<void> {
  const db = await withDb();
  await db.runAsync(`UPDATE session_journal SET status = 'failed', progress = ?, updated_at = ? WHERE id = ?`, [
    JSON.stringify({ error: errorMessage }),
    Date.now(),
    id,
  ]);
}

export async function getRecoverableEntries(): Promise<JournalEntry[]> {
  const db = await withDb();
  const rows = await db.getAllAsync<RawJournalRow>(
    `SELECT * FROM session_journal WHERE status IN ('in_progress', 'failed') ORDER BY created_at DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    payload: safeParse(r.payload),
    progress: safeParse(r.progress),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function discardJournalEntry(id: string): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM session_journal WHERE id = ?`, [id]);
}

// Journal entries older than this are auto-discarded on launch as stale
// (e.g. left over from a version of the app that changed its formats).
const STALE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function pruneStaleJournalEntries(): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM session_journal WHERE created_at < ?`, [Date.now() - STALE_MS]);
}

interface RawJournalRow {
  id: string;
  kind: JournalKind;
  status: JournalStatus;
  payload: string;
  progress: string;
  created_at: number;
  updated_at: number;
}

function safeParse(str: string): Record<string, unknown> | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
