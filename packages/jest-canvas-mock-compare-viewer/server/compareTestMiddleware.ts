import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const JEST_CONFIG_FILENAMES = [
  'jest.config.js',
  'jest.config.cjs',
  'jest.config.mjs',
  'jest.config.ts',
  'jest.config.json',
] as const;

const OUTPUT_CAP_BYTES = 256 * 1024;
const JEST_TIMEOUT_MS = 60 * 1000;

function escapeRegex(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function capOutput(buf: string): string {
  if (buf.length <= OUTPUT_CAP_BYTES) {
    return buf;
  }
  return `…(truncated, showing last ${OUTPUT_CAP_BYTES} chars)\n${buf.slice(-OUTPUT_CAP_BYTES)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function narrowString(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key];
  return typeof v === 'string' ? v : undefined;
}

function narrowBool(o: Record<string, unknown>, key: string): boolean | undefined {
  const v = o[key];
  return typeof v === 'boolean' ? v : undefined;
}

function throwErr(statusCode: number, error: string, res: ServerResponse): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: false, error }));
}

function capStream(chunk: Buffer, out: string): string {
  let next = out + chunk.toString('utf8');
  if (next.length > OUTPUT_CAP_BYTES * 2) {
    next = next.slice(-OUTPUT_CAP_BYTES * 2);
  }
  return next;
}

function directoryHasJestConfig(dir: string): boolean {
  for (const name of JEST_CONFIG_FILENAMES) {
    if (existsSync(join(dir, name))) {
      return true;
    }
  }
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) {
    return false;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || parsed === null) {
      return false;
    }
    const jestField = 'jest' in parsed && parsed.jest;
    if (jestField === undefined) {
      return false;
    }
    if (typeof jestField === 'string') {
      return jestField.length > 0;
    }
    return typeof jestField === 'object' && jestField !== null;
  } catch {
    return false;
  }
}

/**
 * Use as Jest `cwd` so rootDir / testMatch apply to the test file's repo (not the viewer/demo cwd).
 */
export function resolveJestCwdForTestFile(testPath: string, fallbackCwd: string): string {
  let dir = resolve(dirname(testPath));
  const root = parse(dir).root;

  while (dir !== root) {
    if (directoryHasJestConfig(dir)) {
      return dir;
    }
    dir = dirname(dir);
  }

  return fallbackCwd;
}

export function buildJestArgv(testName: string, updateSnapshot: boolean, testPath: string): string[] {
  const pattern = `^${escapeRegex(testName)}$`;
  const args: string[] = [];
  if (updateSnapshot) {
    args.push('--updateSnapshot');
  }
  args.push('--testNamePattern', pattern, '--', testPath);
  return args;
}

/**
 * Connect-style middleware: POST `/compare/test` runs Jest for a single test file/name.
 */
export function createCompareTestMiddleware() {
  const fallbackCwd = process.cwd();

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      throwErr(405, 'Method not allowed', res);
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      throwErr(400, 'Invalid JSON body', res);
      return;
    }

    if (!isRecord(body)) {
      throwErr(400, 'Invalid payload', res);
      return;
    }

    const testPath = narrowString(body, 'testPath');
    const testName = narrowString(body, 'testName');
    const updateSnapshot = narrowBool(body, 'updateSnapshot') ?? true;

    if (!testName) {
      throwErr(400, 'Invalid testName', res);
      return;
    }

    if (!testPath) {
      throwErr(400, 'Invalid testPath', res);
      return;
    }

    const absTestPath = isAbsolute(testPath) ? resolve(testPath) : resolve(fallbackCwd, testPath);

    if (!existsSync(absTestPath)) {
      throwErr(400, `No test file found at ${absTestPath}`, res);
      return;
    }

    const jestCwd = resolveJestCwdForTestFile(absTestPath, fallbackCwd);
    const jestArgv = buildJestArgv(testName, updateSnapshot, absTestPath);
    const spawnArgs = ['jest', ...jestArgv];
    const command = ['npx', ...spawnArgs].join(' ');

    const child = spawn('npx', spawnArgs, {
      cwd: jestCwd,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        GEN_CANVAS_OUTPUT_ON_PASS: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d: Buffer) => {
      stdout = capStream(d, stdout);
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr = capStream(d, stderr);
    });

    const exitCode: number = await new Promise((resolve) => {
      let settled = false;
      const finish = (code: number) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(t);
        resolve(code);
      };
      const t = setTimeout(() => {
        child.kill('SIGTERM');
        finish(-1);
      }, JEST_TIMEOUT_MS);

      child.once('close', (code) => {
        return finish(code ?? -1);
      });
      child.once('error', (err) => {
        console.error('failed to run jest command', err);
        return finish(-1);
      });
    });

    const ok = exitCode === 0;
    const payload = {
      ok,
      exitCode,
      stdout: capOutput(stdout),
      stderr: capOutput(stderr),
      command,
      ...(exitCode === -1 ? { error: 'jest timed out or failed to spawn' } : {}),
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
}
