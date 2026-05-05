import type { ViteDevServer } from 'vite';

import { createCompareViewerMiddlewares } from './middlewares';

/**
 * Registers middleware API in vite server
 */
export function acceptSnapshotPlugin(): {
  name: string;
  configureServer(server: ViteDevServer): void;
} {
  return {
    name: 'compare-accept-snapshot',
    configureServer(server: ViteDevServer) {
      const { dynamicPayloadMiddleware, compareTestMiddleware } = createCompareViewerMiddlewares();
      server.middlewares.use(dynamicPayloadMiddleware);
      server.middlewares.use('/compare/test', compareTestMiddleware);
    },
  };
}
