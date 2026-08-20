import * as Crypto from 'expo-crypto';
import { diffLines as jsDiffLinesLib, Change } from 'diff';
import type { DiffHunk } from './index';

export { Crypto as CryptoImpl };

export const CryptoHelpers = {
  async sha256Base64(base64Content: string): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64Content, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  },
};

// Re-exported under the name index.ts expects (`Crypto.sha256Base64`)
export { CryptoHelpers as Crypto };

export function jsDiffLines(a: string, b: string): DiffHunk[] {
  const parts: Change[] = jsDiffLinesLib(a, b);
  const hunks: DiffHunk[] = [];
  let aPos = 0;
  let bPos = 0;
  for (const part of parts) {
    const lineCount = part.count ?? 0;
    if (part.added) {
      hunks.push({ aStart: aPos, aLen: 0, bStart: bPos, bLen: lineCount });
      bPos += lineCount;
    } else if (part.removed) {
      hunks.push({ aStart: aPos, aLen: lineCount, bStart: bPos, bLen: 0 });
      aPos += lineCount;
    } else {
      aPos += lineCount;
      bPos += lineCount;
    }
  }
  return hunks;
}
