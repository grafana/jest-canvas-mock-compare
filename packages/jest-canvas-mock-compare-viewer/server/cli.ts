import connect from 'connect';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';

import { DEFAULT_COMPARE_PAYLOAD_DIRECTORY } from 'jest-canvas-mock-compare/constants';

import { createCompareViewerMiddlewares } from './middlewares';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 5173;

function viewerPackageRoot(): string {
  return path.resolve(__dirname, '..');
}

export function startViewer(): void {
  const cwd = process.cwd();
  const pkgRoot = viewerPackageRoot();
  const spaDist = path.join(pkgRoot, 'dist');
  const payloadAbs = path.join(cwd, DEFAULT_COMPARE_PAYLOAD_DIRECTORY);
  mkdirSync(payloadAbs, { recursive: true });

  const app = connect();
  const { dynamicPayloadMiddleware, compareTestMiddleware } = createCompareViewerMiddlewares();
  app.use(dynamicPayloadMiddleware);
  app.use('/compare/test', compareTestMiddleware);
  app.use(sirv(payloadAbs, { dev: false, etag: true }));
  app.use(sirv(spaDist, { dev: false, etag: true, single: true }));

  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`jest-canvas-mock-compare listening on http://localhost:${PORT}/`);
    console.log(`  SPA: ${spaDist}`);
    console.log(`  Payload dir: ${payloadAbs}`);
    console.log(`  Jest cwd: ${cwd}`);
    console.log(`  Runner: npx jest`);
  });
}

startViewer();
