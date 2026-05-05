import { isSafePayloadBasename } from './normalizePayloadFileParam.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ListedPayloadMetaFromList = {
  snapshotAssertionPassed?: boolean;
  modifiedMs: number;
};

/**
 * Validates list API JSON (`list=1`), including optional `meta` from `meta=1`.
 */
export function readRemotePayloadListResponse(data: unknown):
  | {
      files: string[];
      meta?: Record<string, ListedPayloadMetaFromList>;
    }
  | undefined {
  if (!isRecord(data) || data.ok !== true) {
    return undefined;
  }
  const files = data.files;
  if (!Array.isArray(files)) {
    return undefined;
  }
  const out: string[] = [];
  for (const x of files) {
    if (typeof x !== 'string' || !isSafePayloadBasename(x)) {
      return undefined;
    }
    out.push(x);
  }

  const metaRaw = data.meta;
  if (metaRaw === undefined) {
    return { files: out };
  }
  if (!isRecord(metaRaw)) {
    return undefined;
  }

  const meta: Record<string, ListedPayloadMetaFromList> = {};
  for (const basename of out) {
    const rawEntry = metaRaw[basename];
    if (rawEntry === undefined) {
      continue;
    }
    if (!isRecord(rawEntry)) {
      continue;
    }
    const modifiedMs = rawEntry.modifiedMs;
    if (typeof modifiedMs !== 'number' || Number.isNaN(modifiedMs)) {
      continue;
    }
    const snap = rawEntry.snapshotAssertionPassed;
    const snapshotAssertionPassed = typeof snap === 'boolean' ? snap : undefined;
    meta[basename] = { snapshotAssertionPassed, modifiedMs };
  }

  return { files: out, meta };
}
