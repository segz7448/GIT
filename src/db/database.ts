import * as SQLite from 'expo-sqlite';

/**
 * Central local persistence layer for GIT.
 *
 * This gives the app a real database layer instead of relying purely on
 * in-memory React state, which previously meant:
 *  - no offline repo cache (every screen open re-fetched from GitHub)
 *  - no crash recovery (in-progress uploads/edits vanished on app kill)
 *  - no resumable upload tracking
 *
 * Tables:
 *  - repo_cache        : last-known file tree / repo metadata per repo+branch
 *  - session_journal    : crash-recovery journal for in-flight operations
 *                         (zip uploads, artifact downloads, bulk commits)
 *  - editor_drafts      : autosave drafts for the file editor
 *  - file_meta_cache    : cached "last modified" info per file path (avoids
 *                         refetching commit history on every render)
 *  - file_backups       : local backup snapshots of file content, taken
 *                         automatically on open (pre-edit) and on every
 *                         save (post-edit), so a bad edit or accidental
 *                         overwrite can always be rolled back locally even
 *                         before anything is pushed to GitHub.
 *  - safety_operations  : log of safety-net actions (auto-branch-before-op,
 *                         revert-commit, undo-commit) so the UI can show
 *                         "what happened" and offer one-tap rollback.
 *  - stashes            : named local "shelf" of in-progress file edits,
 *                         a stand-in for `git stash` since there's no
 *                         working directory to stash in a mobile app.
 *  - local_clones       : locally cached full snapshots of a repo+branch's
 *                         file tree ("Clone" in the sense of "keep a
 *                         local, offline-browsable copy"), since there's
 *                         no filesystem git checkout on RN.
 *  - accounts           : multiple saved GitHub accounts, each with its
 *                         own token stored in SecureStore under a unique
 *                         key referenced by token_key.
 *  - terminal_sessions  : metadata for background Termux jobs (multiple
 *                         tabs, persistent sessions) - the actual live
 *                         output lives in Termux's own filesystem under
 *                         ~/.gitmanager/jobs/<job_id>/ and is polled from
 *                         there; this table just remembers which job ids
 *                         exist and their last known status/log so the
 *                         terminal screen can resume tracking them after
 *                         the app restarts.
 *  - codespace_auto_restart : which codespaces the user has opted into
 *                         auto-restart-when-stopped for - see
 *                         db/codespaceAutoRestart.ts for what this can
 *                         and can't actually do.
 *
 * Indexing policy: every table with a synthetic `id`/`*_key` primary key
 * that's also queried by other WHERE-clause columns gets a supporting
 * index on those columns - point lookups by primary key are already fast
 * without one, but the owner/repo/status/etc-filtered list queries below
 * were doing full table scans until Phase 6.
 */

export type SQLiteDb = SQLite.SQLiteDatabase;

let dbPromise: Promise<SQLiteDb> | null = null;

function getDb(): Promise<SQLiteDb> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('gitmanager.db');
  }
  return dbPromise;
}

export async function initDatabase(): Promise<SQLiteDb> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS repo_cache (
      cache_key TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT,
      path TEXT NOT NULL,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_journal (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      progress TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_session_journal_status
      ON session_journal (status, created_at);

    CREATE TABLE IF NOT EXISTS editor_drafts (
      draft_key TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      path TEXT NOT NULL,
      branch TEXT,
      content TEXT NOT NULL,
      base_sha TEXT,
      saved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_meta_cache (
      meta_key TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT,
      path TEXT NOT NULL,
      last_modified INTEGER,
      last_commit_sha TEXT,
      last_commit_message TEXT,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_backups (
      id TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT,
      path TEXT NOT NULL,
      content TEXT NOT NULL,
      source_sha TEXT,
      kind TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_file_backups_lookup
      ON file_backups (owner, repo, branch, path, created_at);

    CREATE TABLE IF NOT EXISTS safety_operations (
      id TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      kind TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_safety_operations_lookup
      ON safety_operations (owner, repo, created_at);

    CREATE TABLE IF NOT EXISTS stashes (
      id TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT,
      label TEXT,
      files TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stashes_lookup
      ON stashes (owner, repo, created_at);

    CREATE TABLE IF NOT EXISTS local_clones (
      id TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      branch TEXT NOT NULL,
      file_count INTEGER NOT NULL,
      total_bytes INTEGER NOT NULL,
      files TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_local_clones_lookup
      ON local_clones (owner, repo, branch);

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL,
      label TEXT,
      token_key TEXT NOT NULL,
      avatar_url TEXT,
      added_at INTEGER NOT NULL,
      last_used_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_last_used
      ON accounts (last_used_at DESC);

    CREATE TABLE IF NOT EXISTS terminal_sessions (
      job_id TEXT PRIMARY KEY NOT NULL,
      tab_label TEXT,
      command TEXT NOT NULL,
      status TEXT NOT NULL,
      last_log TEXT,
      exit_code INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_terminal_sessions_created
      ON terminal_sessions (created_at ASC);

    CREATE TABLE IF NOT EXISTS codespace_auto_restart (
      codespace_name TEXT PRIMARY KEY NOT NULL,
      enabled_at INTEGER NOT NULL
    );
  `);

  // Lightweight migration: content_hash was added after file_backups
  // already shipped, so existing installs need it added in place.
  // ALTER TABLE throws if the column already exists - that's the signal
  // to skip it, there's no separate schema-version table in this app.
  try {
    await db.execAsync(`ALTER TABLE file_backups ADD COLUMN content_hash TEXT;`);
  } catch {
    // column already present - nothing to do
  }
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_file_backups_hash ON file_backups (owner, repo, branch, path, content_hash);`
  );

  return db;
}

export async function withDb(): Promise<SQLiteDb> {
  await initDatabase();
  return getDb();
}

// ---------- generic key helpers ----------

export function repoCacheKey(owner: string, repo: string, branch?: string | null, path?: string | null): string {
  return `${owner}/${repo}@${branch || 'default'}:${path || ''}`;
}

export function fileMetaKey(owner: string, repo: string, branch?: string | null, path?: string): string {
  return `${owner}/${repo}@${branch || 'default'}::${path}`;
}
