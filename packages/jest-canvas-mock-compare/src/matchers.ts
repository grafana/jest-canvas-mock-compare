import { toMatchCanvasSnapshot } from './toMatchCanvasSnapshot.ts';
import type { CustomSnapshotMatchers } from './types.ts';

export const matchers: CustomSnapshotMatchers = {
  toMatchCanvasSnapshot,
};
