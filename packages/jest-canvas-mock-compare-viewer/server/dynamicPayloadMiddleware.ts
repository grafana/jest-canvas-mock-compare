import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

import { CANVAS_COMPARE_PAYLOAD_API_PATH } from '../src/constants';
import { isSafePayloadBasename } from '../src/normalizePayloadFileParam';

function resolvedRealpath(absoluteInput: string): string {
  return realpathSync(absoluteInput);
}

function endsWithFatalNotFound(err: unknown): boolean {
  // narrow err
  const code = typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined;
  return code === 'ENOENT' || code === 'ENOTDIR';
}

/** PathTraversal-safe: basename must satisfy {@link isSafePayloadBasename}; result must lie under resolved root directory. */
export function resolveReadablePayloadUnderRoot(payloadRootTrimmed: string, basename: string): string | null {
  if (!payloadRootTrimmed) {
    console.warn('Missing payload root', payloadRootTrimmed);
    return null;
  }
  if (!isSafePayloadBasename(basename)) {
    console.warn('Not safe payload', basename);
    return null;
  }

  let rootRealpath: string;
  try {
    const stRoot = statSync(payloadRootTrimmed);
    if (!stRoot.isDirectory()) {
      console.warn('invalid directory', stRoot);
      return null;
    }
    rootRealpath = resolvedRealpath(path.resolve(payloadRootTrimmed));
  } catch (e) {
    console.warn('failed to resolve', { payloadRootTrimmed, resolved: path.resolve(payloadRootTrimmed) });
    if (endsWithFatalNotFound(e)) {
      return null;
    }
    throw e;
  }

  let fileRealpath: string;
  try {
    fileRealpath = resolvedRealpath(path.resolve(rootRealpath, basename));
  } catch (e) {
    if (endsWithFatalNotFound(e)) {
      console.warn('failed to resolve', { rootRealpath, basename, e });
      return null;
    }
    throw e;
  }

  const parentPrefix =
    rootRealpath.endsWith(path.sep) || rootRealpath.endsWith('\\') ? rootRealpath : `${rootRealpath}${path.sep}`;
  const inside = fileRealpath === rootRealpath || fileRealpath.startsWith(parentPrefix);
  if (!inside) {
    return null;
  }

  try {
    const stFile = statSync(fileRealpath);
    if (!stFile.isFile()) {
      return null;
    }
  } catch (e) {
    console.warn('statSync failed', e);
    return null;
  }

  return fileRealpath;
}

/** List readable `*.json` basenames strictly under resolved root directory. */
export function listReadablePayloadBasenames(payloadRootTrimmed: string): string[] | null {
  if (!payloadRootTrimmed) {
    return null;
  }

  let rootRealpath: string;
  try {
    const stRoot = statSync(payloadRootTrimmed);
    if (!stRoot.isDirectory()) {
      return null;
    }
    rootRealpath = resolvedRealpath(path.resolve(payloadRootTrimmed));
  } catch (e) {
    if (endsWithFatalNotFound(e)) {
      return null;
    }
    throw e;
  }

  try {
    const names = readdirSync(rootRealpath, { encoding: 'utf8' }).filter((n) => /\.json$/i.test(n));
    const safeBasenames = names.filter((n) => isSafePayloadBasename(n)).sort((a, b) => a.localeCompare(b));
    return safeBasenames.filter((basename) => resolveReadablePayloadUnderRoot(payloadRootTrimmed, basename));
  } catch {
    return null;
  }
}

function send(res: ServerResponse, statusCode: number, body: Buffer | string, headers: Record<string, string>): void {
  res.statusCode = statusCode;
  for (const [key, val] of Object.entries(headers)) {
    res.setHeader(key, val);
  }
  res.end(body);
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  send(res, statusCode, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

export type ListedPayloadMeta = {
  snapshotAssertionPassed?: boolean;
  /** `Date.getTime()` from file mtime */
  modifiedMs: number;
};

/** @internal Exported for tests */
export function readListedPayloadMeta(absolute: string): ListedPayloadMeta {
  let modifiedMs = 0;
  try {
    modifiedMs = statSync(absolute).mtimeMs;
  } catch {
    return { modifiedMs: 0 };
  }

  let snapshotAssertionPassed: boolean | undefined;
  try {
    const raw = readFileSync(absolute, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'snapshotAssertionPassed' in parsed &&
      typeof parsed.snapshotAssertionPassed === 'boolean'
    ) {
      snapshotAssertionPassed = parsed.snapshotAssertionPassed;
    }
  } catch {
    // Invalid JSON — still expose mtime
    console.warn(`Failed to parse file: ${absolute}`);
  }

  return { snapshotAssertionPassed, modifiedMs };
}

/**
 * Serves compare payloads from an arbitrary directory when the client passes `payloadRoot` in the query string
 * (see printed links from `jest-canvas-mock-compare`).
 */
export function createDynamicPayloadMiddleware(): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void {
  return (req, res, next) => {
    const urlRaw = req.url;
    if (!urlRaw) {
      next();
      return;
    }

    let pathname: string;
    let searchParams: URLSearchParams;
    try {
      const u = new URL(urlRaw, 'http://jest-canvas-mock-compare.local');
      pathname = u.pathname;
      searchParams = u.searchParams;
    } catch {
      next();
      console.warn(`Failed to parse URL: ${urlRaw}`);
      return;
    }

    if (pathname !== CANVAS_COMPARE_PAYLOAD_API_PATH) {
      next();
      return;
    }

    const payloadRoot = searchParams.get('payloadRoot')?.trim() ?? '';
    if (!payloadRoot) {
      sendJson(res, 400, { ok: false, error: 'Missing payloadRoot' });
      return;
    }

    const listMode = searchParams.get('list') === '1' || searchParams.get('list') === 'true';
    if (listMode) {
      const files = listReadablePayloadBasenames(payloadRoot);
      if (files === null) {
        sendJson(res, 404, { ok: false, error: 'Could not read payload directory' });
        return;
      }

      const wantMeta = searchParams.get('meta') === '1' || searchParams.get('meta') === 'true';
      if (!wantMeta) {
        sendJson(res, 200, { ok: true, files });
        return;
      }

      const meta: Record<string, ListedPayloadMeta> = {};
      for (const basename of files) {
        const absolute = resolveReadablePayloadUnderRoot(payloadRoot, basename);
        if (!absolute) {
          continue;
        }
        meta[basename] = readListedPayloadMeta(absolute);
      }

      sendJson(res, 200, { ok: true, files, meta });
      return;
    }

    // The frontend appends timestamp in an attempt to cache bust
    const file = searchParams.get('file')?.trim().split('?')[0] ?? '';
    if (!file) {
      sendJson(res, 400, { ok: false, error: 'Missing file' });
      return;
    }

    const absolute = resolveReadablePayloadUnderRoot(payloadRoot, file);
    if (!absolute) {
      console.log('invalid file', { payloadRoot, file, absolute });
      sendJson(res, 404, { ok: false, error: 'Payload not found' });
      return;
    }

    if (req.method === 'HEAD') {
      let mtimeMs: number;
      try {
        const st = statSync(absolute);
        mtimeMs = st.mtimeMs;
      } catch {
        send(res, 404, '', {});
        return;
      }
      const date = new Date(mtimeMs);
      send(res, 200, '', {
        'Content-Type': 'application/json',
        'Last-Modified': date.toUTCString(),
      });
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }

    let body: Buffer;
    let lastModifiedMs: number;
    try {
      body = readFileSync(absolute);
      lastModifiedMs = statSync(absolute).mtimeMs;
    } catch {
      sendJson(res, 404, { ok: false, error: 'Could not read payload' });
      return;
    }

    const date = new Date(lastModifiedMs);
    send(res, 200, body, {
      'Content-Type': 'application/json; charset=utf-8',
      'Last-Modified': date.toUTCString(),
    });
  };
}
