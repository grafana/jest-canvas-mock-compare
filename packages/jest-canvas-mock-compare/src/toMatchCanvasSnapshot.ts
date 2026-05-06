import { type MatcherContext } from 'expect';
import { type CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import { type Context, toMatchSnapshot } from 'jest-snapshot';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { DEFAULT_COMPARE_PAYLOAD_DIRECTORY } from './constants.ts';
import { parseSnapshotJson } from './parseSnapshotJson.ts';
import { jestSnapshotRootDirFromContext, resolveCanvasComparePayloadWriteTarget } from './payloadWriteTarget.ts';
import type { JestCanvasMockComparePayload } from './types.ts';
import { buildCompareViewerUrl } from './viewerLink.ts';

export type ToMatchSnapshotRest = Parameters<typeof toMatchSnapshot> extends [unknown, ...infer R] ? R : never;

type CanvasSize = {
  width: number;
  height: number;
};

type SnapshotMismatch = jest.CustomMatcherResult & {
  expected?: string;
};

export function toMatchCanvasSnapshot(
  this: MatcherContext,
  received: CanvasRenderingContext2DEvent[],
  canvasContextEvents: CanvasRenderingContext2DEvent[],
  size: CanvasSize,
  snapshotHint?: string,
  ...rest: ToMatchSnapshotRest
): jest.CustomMatcherResult {
  const payloadWidth = size.width;
  const payloadHeight = size.height;

  const [propertiesOrHint, hint] = rest;
  const snapshotName = snapshotHint ?? hint;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const snapshotContext = this as Context;

  const callArgs: unknown[] = [received];
  if (propertiesOrHint) {
    callArgs.push(propertiesOrHint);
  }
  if (snapshotName) {
    callArgs.push(snapshotName);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- jest-snapshot overload tuple
  const baseResult = toMatchSnapshot.apply(snapshotContext, callArgs as Parameters<typeof toMatchSnapshot>);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const result = baseResult as SnapshotMismatch;

  // Does not run in CI, will behave like a regular snapshot test
  if (!process.env.CI && ((!result.pass && result.expected != null) || process.env.GEN_CANVAS_OUTPUT_ON_PASS)) {
    let expected = result.expected;
    if (!expected) {
      expected = JSON.stringify(received);
    }
    let parsedExpected;
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      parsedExpected = parseSnapshotJson(expected) as CanvasRenderingContext2DEvent[];
    } catch (e) {
      console.error('toMatchCanvasSnapshot: failed to parse expected snapshot JSON', e);
      return result;
    }

    const testName = this.currentTestName ?? '';
    const payload: JestCanvasMockComparePayload = {
      testName,
      testPath: this.testPath,
      expected: parsedExpected,
      actual: received,
      canvasContextEvents: canvasContextEvents,
      width: payloadWidth,
      height: payloadHeight,
      snapshotAssertionPassed: result.pass,
    };

    const projectRoot = jestSnapshotRootDirFromContext(snapshotContext) ?? process.cwd();
    const payloadDir = path.join(projectRoot, DEFAULT_COMPARE_PAYLOAD_DIRECTORY);
    const { fullPath, publicBasename } = resolveCanvasComparePayloadWriteTarget(payloadDir, testName);
    try {
      mkdirSync(path.dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, `${JSON.stringify(payload)}\n`, 'utf8');
      const compareUrl = buildCompareViewerUrl('http://localhost:5173/', publicBasename, payloadDir);
      // Use stderr so jest-fail-on-console (console.* hooks) does not treat this as a test failure
      process.stderr.write(
        `To debug this diff visually, run the compare viewer (e.g. \`npx jest-canvas-mock-compare-viewer\`), then open:\n${compareUrl.toString()}\n(Payload written to ${fullPath})\n\n`
      );
    } catch (e) {
      console.warn(
        `[toMatchCanvasSnapshot] Could not write compare payload to ${fullPath}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return result;
}
