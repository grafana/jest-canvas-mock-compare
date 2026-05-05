import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { acceptSnapshotPlugin } from './server/acceptSnapshotPlugin';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  // Payload JSON from `toMatchCanvasSnapshot` is written under `./.jest-canvas-mock-compare/`
  publicDir: '.jest-canvas-mock-compare',
  plugins: [react(), acceptSnapshotPlugin()],
  // Snapshot types use `import type` from jest-canvas-mock; do not pre-bundle its runtime (global `jest`) for the client.
  optimizeDeps: {
    exclude: ['jest-canvas-mock'],
  },
});
