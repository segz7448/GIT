import { withDb } from './database';

/**
 * Autosave layer for the file editor. Every few seconds while a file is
 * dirty, its content is saved here. If the app crashes or is killed
 * before the user commits/stages, reopening the same file offers to
 * restore the unsaved draft instead of silently losing the edit.
 */

export interface Draft {
  content: string;
  baseSha: string | null;
  savedAt: number;
}

export interface AllDraftsRow extends Draft {
  owner: string;
  repo: string;
  path: string;
  branch: string | null;
}

function draftKey(owner: string, repo: string, path: string, branch?: string | null): string {
  return `${owner}/${repo}@${branch || 'default'}::${path}`;
}

export async function saveDraft(
  owner: string,
  repo: string,
  path: string,
  branch: string | null | undefined,
  content: string,
  baseSha?: string | null
): Promise<void> {
  const db = await withDb();
  const key = draftKey(owner, repo, path, branch);
  await db.runAsync(
    `INSERT INTO editor_drafts (draft_key, owner, repo, path, branch, content, base_sha, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(draft_key) DO UPDATE SET content = excluded.content, base_sha = excluded.base_sha, saved_at = excluded.saved_at`,
    [key, owner, repo, path, branch || '', content, baseSha || null, Date.now()]
  );
}

export async function getDraft(
  owner: string,
  repo: string,
  path: string,
  branch?: string | null
): Promise<Draft | null> {
  const db = await withDb();
  const key = draftKey(owner, repo, path, branch);
  const row = await db.getFirstAsync<{ content: string; base_sha: string | null; saved_at: number }>(
    `SELECT * FROM editor_drafts WHERE draft_key = ?`,
    [key]
  );
  if (!row) return null;
  return {
    content: row.content,
    baseSha: row.base_sha,
    savedAt: row.saved_at,
  };
}

export async function clearDraft(owner: string, repo: string, path: string, branch?: string | null): Promise<void> {
  const db = await withDb();
  const key = draftKey(owner, repo, path, branch);
  await db.runAsync(`DELETE FROM editor_drafts WHERE draft_key = ?`, [key]);
}

export async function listAllDrafts(): Promise<AllDraftsRow[]> {
  const db = await withDb();
  const rows = await db.getAllAsync<{
    owner: string;
    repo: string;
    path: string;
    branch: string | null;
    content: string;
    base_sha: string | null;
    saved_at: number;
  }>(`SELECT * FROM editor_drafts ORDER BY saved_at DESC`);
  return rows.map((r) => ({
    owner: r.owner,
    repo: r.repo,
    path: r.path,
    branch: r.branch || null,
    content: r.content,
    baseSha: r.base_sha,
    savedAt: r.saved_at,
  }));
}
