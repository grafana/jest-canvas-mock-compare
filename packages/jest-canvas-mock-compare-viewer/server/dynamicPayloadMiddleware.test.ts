import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readListedPayloadMeta, resolveReadablePayloadUnderRoot } from './dynamicPayloadMiddleware.ts';

describe('resolveReadablePayloadUnderRoot', () => {
  it('resolves a nested json file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-'));
    const name = 'jest-canvas-compare-test.json';
    fs.writeFileSync(path.join(root, name), '{}\n');

    const resolved = resolveReadablePayloadUnderRoot(root, name);
    expect(resolved && fs.existsSync(resolved)).toBe(true);
    expect(resolved).toBe(fs.realpathSync(path.join(root, name)));
  });

  it('rejects traversal embedded in basename patterns', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-'));
    expect(resolveReadablePayloadUnderRoot(root, '../etc/passwd.json')).toBe(null);
  });

  it('returns null for missing files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-'));
    expect(resolveReadablePayloadUnderRoot(root, 'nope.json')).toBe(null);
  });
});

describe('readListedPayloadMeta', () => {
  it('reads mtime and snapshotAssertionPassed from valid JSON', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-'));
    const name = 'jest-canvas-compare-meta.json';
    const abs = path.join(root, name);
    fs.writeFileSync(
      abs,
      JSON.stringify({
        testName: 't',
        expected: [],
        actual: [],
        canvasContextEvents: [],
        snapshotAssertionPassed: false,
      })
    );

    const meta = readListedPayloadMeta(abs);
    expect(meta.snapshotAssertionPassed).toBe(false);
    expect(meta.modifiedMs).toBeGreaterThan(0);
  });

  it('returns mtime when JSON is invalid', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-'));
    const name = 'bad.json';
    const abs = path.join(root, name);
    fs.writeFileSync(abs, 'not json');

    const meta = readListedPayloadMeta(abs);
    expect(meta.snapshotAssertionPassed).toBeUndefined();
    expect(meta.modifiedMs).toBeGreaterThan(0);
  });
});
