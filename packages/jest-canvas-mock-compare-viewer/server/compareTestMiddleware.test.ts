import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildJestArgv,
  formatNpxJestCommand,
  resolveJestCwdForTestFile,
  shellSingleQuoteForSh,
} from './compareTestMiddleware.ts';

describe('formatNpxJestCommand', () => {
  it('quotes args so shell metacharacters in testNamePattern are not expanded', () => {
    const testName = 'HeatmapPanel (canvas) Annotations Regression: does NOT render regions';
    const testPath = '/Users/x/grafana/public/app/plugins/panel/heatmap/HeatmapPanel.canvas.test.tsx';
    const spawnArgs = ['jest', ...buildJestArgv(testName, false, testPath)];
    expect(formatNpxJestCommand(spawnArgs)).toBe(
      `'npx' 'jest' '--testNamePattern' '^HeatmapPanel \\(canvas\\) Annotations Regression: does NOT render regions$' '--' '${testPath}'`
    );
  });

  it('escapes single quotes inside args', () => {
    expect(shellSingleQuoteForSh("it's")).toBe(`'it'\\''s'`);
  });
});

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
