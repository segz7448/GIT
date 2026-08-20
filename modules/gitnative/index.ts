import { requireNativeModule } from 'expo-modules-core';

interface GitNativeNativeModule {
  isAvailable(): boolean;
  hashBlobBase64(base64Content: string): Promise<string>;
  diffLines(a: string, b: string): Promise<string>;
}

let native: GitNativeNativeModule | null = null;
try {
  native = requireNativeModule<GitNativeNativeModule>('GitNative');
} catch {
  native = null; // module not linked yet (e.g. before first prebuild) — fine
}

export interface DiffHunk {
  aStart: number;
  aLen: number;
  bStart: number;
  bLen: number;
}

export function isNativeAccelAvailable(): boolean {
  try {
    return !!native && native.isAvailable();
  } catch {
    return false;
  }
}

/** Content-addressed blob hash. Falls back to a pure-JS SHA-256 if the
 * native Kotlin/C++/Rust module isn't available on this build/device. */
export async function hashBlob(base64Content: string): Promise<string> {
  if (isNativeAccelAvailable()) {
    try {
      return await native!.hashBlobBase64(base64Content);
    } catch {
      // fall through to JS path below
    }
  }
  const { Crypto } = await import('./fallback');
  return Crypto.sha256Base64(base64Content);
}

/** Line-level diff hunks. Falls back to the existing `diff` npm package
 * (already a dependency) when native acceleration isn't available. */
export async function diffLines(a: string, b: string): Promise<DiffHunk[]> {
  if (isNativeAccelAvailable()) {
    try {
      const json = await native!.diffLines(a, b);
      return JSON.parse(json) as DiffHunk[];
    } catch {
      // fall through to JS path below
    }
  }
  const { jsDiffLines } = await import('./fallback');
  return jsDiffLines(a, b);
}
