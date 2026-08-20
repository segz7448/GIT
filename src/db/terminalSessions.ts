import { withDb } from './database';

/**
 * Local bookkeeping for Termux background jobs (see src/services/termux.js
 * for the actual execution/polling mechanics). This table is what makes
 * "multiple terminal tabs" and "persistent sessions" possible: each row
 * is one tab, remembering which job id it's watching and the last known
 * output/status, so re-opening the Terminal screen (even after the app
 * was fully killed and relaunched) can immediately show where things
 * left off and resume polling, rather than losing track of what was
 * running.
 */

export type SessionStatus = 'starting' | 'running' | 'finished';

export interface TerminalSession {
  jobId: string;
  tabLabel: string;
  command: string;
  status: SessionStatus;
  lastLog: string;
  exitCode: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SessionUpdate {
  status?: SessionStatus;
  lastLog?: string;
  exitCode?: number | null;
}

function genJobId(): string {
  return `job${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export async function createSession(command: string, tabLabel?: string | null): Promise<string> {
  const db = await withDb();
  const jobId = genJobId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO terminal_sessions (job_id, tab_label, command, status, last_log, exit_code, created_at, updated_at)
     VALUES (?, ?, ?, 'starting', '', NULL, ?, ?)`,
    [jobId, tabLabel || null, command, now, now]
  );
  return jobId;
}

export async function updateSession(jobId: string, { status, lastLog, exitCode }: SessionUpdate): Promise<void> {
  const db = await withDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }
  if (lastLog !== undefined) {
    fields.push('last_log = ?');
    values.push(lastLog);
  }
  if (exitCode !== undefined) {
    fields.push('exit_code = ?');
    values.push(exitCode);
  }
  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(jobId);
  await db.runAsync(`UPDATE terminal_sessions SET ${fields.join(', ')} WHERE job_id = ?`, values);
}

export async function listSessions(): Promise<TerminalSession[]> {
  const db = await withDb();
  const rows = await db.getAllAsync<RawSessionRow>(`SELECT * FROM terminal_sessions ORDER BY created_at ASC`);
  return rows.map(mapRow);
}

export async function getSession(jobId: string): Promise<TerminalSession | null> {
  const db = await withDb();
  const row = await db.getFirstAsync<RawSessionRow>(`SELECT * FROM terminal_sessions WHERE job_id = ?`, [jobId]);
  return row ? mapRow(row) : null;
}

export async function deleteSession(jobId: string): Promise<void> {
  const db = await withDb();
  await db.runAsync(`DELETE FROM terminal_sessions WHERE job_id = ?`, [jobId]);
}

interface RawSessionRow {
  job_id: string;
  tab_label: string | null;
  command: string;
  status: SessionStatus;
  last_log: string | null;
  exit_code: number | null;
  created_at: number;
  updated_at: number;
}

function mapRow(row: RawSessionRow): TerminalSession {
  return {
    jobId: row.job_id,
    tabLabel: row.tab_label || row.command,
    command: row.command,
    status: row.status,
    lastLog: row.last_log || '',
    exitCode: row.exit_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
