import { createCompareTestMiddleware } from './compareTestMiddleware';
import { createDynamicPayloadMiddleware } from './dynamicPayloadMiddleware';

/** Dynamic payload routing + `/compare/test` Jest runner; shared by CLI and Vite dev. */
export function createCompareViewerMiddlewares(): {
  dynamicPayloadMiddleware: ReturnType<typeof createDynamicPayloadMiddleware>;
  compareTestMiddleware: ReturnType<typeof createCompareTestMiddleware>;
} {
  return {
    dynamicPayloadMiddleware: createDynamicPayloadMiddleware(),
    compareTestMiddleware: createCompareTestMiddleware(),
  };
}
