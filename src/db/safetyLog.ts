import { withDb } from './database';

/**
 * Log of "safety net" actions the app takes on the user's behalf:
 *  - auto_branch: a backup branch was created before a risky bulk
 *    operation (ZIP upload, bulk edit)
 *  - revert_commit: a commit was reverted
 *  - undo_commit: the last commit on a branch was undone (branch ref
 *    force-moved back to its parent)
 *
 * This is purely a local audit trail so the UI can show "what safety
 * actions have happened on this repo" and let the user jump back to a
 * backup branch, it doesn't affect GitHub state by itself.
 */

export interface SafetyOperation {
  id: string;
  kind: string;
  details: Record<string, unknown>;
  createdAt: number;
}

function genId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function logSafetyOperation(
  owner: string,
  repo: string,
  kind: string,
  details?: Record<string, unknown>
): Promise<string> {
  const db = await withDb();
  const id = genId();
  await db.runAsync(
    `INSERT INTO safety_operations (id, owner, repo, kind, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, owner, repo, kind, JSON.stringify(details || {}), Date.now()]
  );
  return id;
}

export async function listSafetyOperations(owner: string, repo: string, limit = 50): Promise<SafetyOperation[]> {
  const db = await withDb();
  const rows = await db.getAllAsync<{ id: string; kind: string; details: string; created_at: number }>(
    `SELECT * FROM safety_operations WHERE owner = ? AND repo = ? ORDER BY created_at DESC LIMIT ?`,
    [owner, repo, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    details: safeParse(r.details),
    createdAt: r.created_at,
  }));
}

function safeParse(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
