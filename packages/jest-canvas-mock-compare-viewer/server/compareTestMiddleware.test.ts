import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveJestCwdForTestFile } from './compareTestMiddleware.ts';

describe('resolveJestCwdForTestFile', () => {
  it('returns the directory that contains jest.config.cjs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-jestcwd-'));
    const sub = path.join(root, 'nested', 'deep');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(root, 'jest.config.cjs'), 'module.exports = {}\n');
    const testFile = path.join(sub, 'a.test.ts');
    fs.writeFileSync(testFile, '');

    expect(resolveJestCwdForTestFile(testFile, '/fallback')).toBe(root);
  });

  it('returns the directory that contains package.json with a jest field', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-jestcwd-'));
    const sub = path.join(root, 'pkg');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', jest: { testEnvironment: 'node' } }));
    const testFile = path.join(sub, 'b.test.ts');
    fs.writeFileSync(testFile, '');

    expect(resolveJestCwdForTestFile(testFile, '/fallback')).toBe(root);
  });

  it('uses fallback when no jest config is found in parent dirs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jcmc-jestcwd-'));
    const testFile = path.join(root, 'orphan.test.ts');
    fs.writeFileSync(testFile, '');

    expect(resolveJestCwdForTestFile(testFile, '/expected-fallback')).toBe('/expected-fallback');
  });
});
