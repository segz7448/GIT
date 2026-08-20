import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const WATCHLIST_KEY = 'watched_runs_v1';
const WATCHED_REPOS_KEY = 'watched_repos_v1';

export interface WatchedRun {
  owner: string;
  repo: string;
  runId: number;
  runName: string;
  addedAt: number;
}

export interface WatchedRepo {
  owner: string;
  repo: string;
  lastSeenRunId: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function presentLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // fire immediately
  });
}

// ---------- Watchlist (runs the background task should poll) ----------

async function readWatchlist(): Promise<WatchedRun[]> {
  try {
    const raw = await SecureStore.getItemAsync(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as WatchedRun[]) : [];
  } catch {
    return [];
  }
}

async function writeWatchlist(list: WatchedRun[]): Promise<void> {
  await SecureStore.setItemAsync(WATCHLIST_KEY, JSON.stringify(list));
}

export async function getWatchlist(): Promise<WatchedRun[]> {
  return readWatchlist();
}

export async function isRunWatched(owner: string, repo: string, runId: number): Promise<boolean> {
  const list = await readWatchlist();
  return list.some((w) => w.owner === owner && w.repo === repo && w.runId === runId);
}

export async function addRunToWatchlist({
  owner,
  repo,
  runId,
  runName,
}: {
  owner: string;
  repo: string;
  runId: number;
  runName?: string;
}): Promise<void> {
  const list = await readWatchlist();
  if (list.some((w) => w.owner === owner && w.repo === repo && w.runId === runId)) return;
  list.push({ owner, repo, runId, runName: runName || `Run #${runId}`, addedAt: Date.now() });
  await writeWatchlist(list);
}

export async function removeRunFromWatchlist(owner: string, repo: string, runId: number): Promise<void> {
  const list = await readWatchlist();
  const filtered = list.filter((w) => !(w.owner === owner && w.repo === repo && w.runId === runId));
  await writeWatchlist(filtered);
}

// ---------- Watched repos (auto-notify on every Actions run completion,
// not just a single manually-picked run) ----------

async function readWatchedRepos(): Promise<WatchedRepo[]> {
  try {
    const raw = await SecureStore.getItemAsync(WATCHED_REPOS_KEY);
    return raw ? (JSON.parse(raw) as WatchedRepo[]) : [];
  } catch {
    return [];
  }
}

async function writeWatchedRepos(list: WatchedRepo[]): Promise<void> {
  await SecureStore.setItemAsync(WATCHED_REPOS_KEY, JSON.stringify(list));
}

export async function getWatchedRepos(): Promise<WatchedRepo[]> {
  return readWatchedRepos();
}

export async function isRepoWatched(owner: string, repo: string): Promise<boolean> {
  const list = await readWatchedRepos();
  return list.some((w) => w.owner === owner && w.repo === repo);
}

/**
 * lastSeenRunId is seeded to the repo's current latest run at the moment
 * watching starts, so turning this on doesn't immediately fire a
 * notification for a run that already finished before you started
 * watching.
 */
export async function addRepoToWatchlist(owner: string, repo: string, lastSeenRunId?: number): Promise<void> {
  const list = await readWatchedRepos();
  if (list.some((w) => w.owner === owner && w.repo === repo)) return;
  list.push({ owner, repo, lastSeenRunId: lastSeenRunId || 0 });
  await writeWatchedRepos(list);
}

export async function removeRepoFromWatchlist(owner: string, repo: string): Promise<void> {
  const list = await readWatchedRepos();
  const filtered = list.filter((w) => !(w.owner === owner && w.repo === repo));
  await writeWatchedRepos(filtered);
}

export async function updateWatchedRepoLastSeenRunId(owner: string, repo: string, runId: number): Promise<void> {
  const list = await readWatchedRepos();
  const updated = list.map((w) => (w.owner === owner && w.repo === repo ? { ...w, lastSeenRunId: runId } : w));
  await writeWatchedRepos(updated);
}
