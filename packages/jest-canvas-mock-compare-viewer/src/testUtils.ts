import type { JestCanvasMockComparePayload } from 'jest-canvas-mock-compare';

/**
 * Narrow the payload type
 * @param payload
 */
export function isCanvasComparePayload(payload: unknown): payload is JestCanvasMockComparePayload {
  if (!payload || typeof payload !== 'object' || !('testName' in payload)) {
    return false;
  }

  return typeof payload.testName === 'string' && 'expected' in payload && 'actual' in payload;
}
