import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import type { toMatchSnapshot } from 'jest-snapshot';
/** JSON payload written beside the test workspace for the compare viewer (`jest-canvas-mock-compare-viewer`). */
export interface JestCanvasMockComparePayload {
  testName: string;
  /** Absolute path to the test file; used by jest-canvas-mock-compare to run `jest -u` for Accept baseline. */
  testPath?: string;
  /**
   * serialized output of snapshot test
   */
  expected: unknown;
  /**
   * serialized output from snapshot file
   */
  actual: unknown;
  /**
   * additional canvas context outside the scope of the test assertion. These events will be rendered in the panel
   */
  canvasContextEvents: CanvasRenderingContext2DEvent[] | Array<Omit<CanvasRenderingContext2DEvent, 'transform'>>;
  /** test canvas width (CSS px) */
  width: number;
  /** test canvas height (CSS px) */
  height: number;
  /** whether the Jest snapshot assertion passed when the test last failed (or was run with GEN_CANVAS_OUTPUT_ON_PASS). */
  snapshotAssertionPassed?: boolean;
}

type ToMatchSnapshotRest = Parameters<typeof toMatchSnapshot> extends [unknown, ...infer R] ? R : never;

export interface CustomSnapshotMatchers extends jest.ExpectExtendMap {
  toMatchCanvasSnapshot(
    receivedEvents: CanvasRenderingContext2DEvent[],
    canvasContextEvents: CanvasRenderingContext2DEvent[],
    canvasSize: { width: number; height: number },
    snapshotHint?: string,
    ...rest: ToMatchSnapshotRest
  ): jest.CustomMatcherResult;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    /* eslint-disable @typescript-eslint/no-unused-vars -- `T` is required for declaration merging with @types/jest */
    /* eslint-disable @typescript-eslint/no-empty-object-type -- `{}` matches @types/jest default */
    interface Matchers<R, T = {}> {
      /**
       * Canvas snapshot tests to be used on the output of jest-canvas-mock
       * Failed tests will generate a link to view the diff between canvas outputs
       * See public/app/plugins/panel/candlestick/utils.canvas.test.ts for an example
       *
       * @param canvasContextEvents
       * @param size - canvas dimensions for the jest-canvas-mock-compare JSON payload
       * @param snapshotHint - optional Jest snapshot name passed to toMatchSnapshot
       */
      toMatchCanvasSnapshot(
        canvasContextEvents: CanvasRenderingContext2DEvent[],
        size: { width: number; height: number },
        snapshotHint?: string
      ): R;
    }
    /* eslint-enable @typescript-eslint/no-empty-object-type */
    /* eslint-enable @typescript-eslint/no-unused-vars */
  }
}
