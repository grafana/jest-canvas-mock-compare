import path from 'node:path';

import { type Context } from 'jest-snapshot';

import { createCanvasComparePayloadBasename } from './canvasComparePayload.ts';

/**
 * Jest stores `rootDir` on SnapshotState as `_rootDir` (runtime field; aligns output with snapshots when cwd differs).
 */
export function jestSnapshotRootDirFromContext(snapshotContext: Context): string | undefined {
  const state = snapshotContext.snapshotState;
  if (!state) {
    return undefined;
  }
  const raw: unknown = Reflect.get(state, '_rootDir');
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

/** Payload path under `{rootDir}/.jest-canvas-mock-compare/` plus basename used in compare URLs. */
export function resolveCanvasComparePayloadWriteTarget(
  payloadDir: string,
  testName: string
): {
  fullPath: string;
  publicBasename: string;
} {
  const basename = createCanvasComparePayloadBasename(testName);
  const fullPath = path.join(payloadDir, basename);
  return { fullPath, publicBasename: basename };
}
