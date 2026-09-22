import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import type { JestCanvasMockComparePayload } from 'jest-canvas-mock-compare';

export type ResolvedPayload = {
  testName: string;
  testPath?: string;
  expected: CanvasRenderingContext2DEvent[];
  actual: CanvasRenderingContext2DEvent[];
  uPlotCanvasEvents: JestCanvasMockComparePayload['canvasContextEvents'];
  width?: number;
  height?: number;
  snapshotAssertionPassed?: boolean;
};

export type AcceptBaselineState =
  | { kind: 'idle' }
  | { kind: 'running'; updateSnapshot: boolean }
  | {
      kind: 'success';
      updateSnapshot: boolean;
      stdout: string;
      stderr: string;
      command: string;
    }
  | {
      kind: 'error';
      updateSnapshot?: boolean;
      message: string;
      stdout: string;
      stderr: string;
      command?: string;
    };

export interface ComparePlotsProps {
  defaultWidth: number;
  defaultHeight: number;
  payload: ResolvedPayload;
  acceptBaselineState: AcceptBaselineState;
  onBackToIndex: () => void;
  /** When non-null, navigates to that payload file (next failed snapshot in list order, wrapping). */
  nextFailedTestBasename: string | null;
  onGoToNextFailedTest: () => void;
  onRerunTest: () => void;
  onAcceptBaseline: () => void;
}
