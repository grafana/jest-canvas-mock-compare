# jest-canvas-mock-compare demo

Minimal Jest + TypeScript reproduction for [`jest-canvas-mock-compare`](https://www.npmjs.com/package/jest-canvas-mock-compare).

This folder is **not** a Yarn workspace of the parent monorepo: it has its own `package.json` and `yarn.lock`, and pulls the matcher + viewer in via `file:../packages/…` (see [`AGENTS.md`](./AGENTS.md)).

## Prerequisites

From **this directory**:

```bash
yarn install
```

From the **repository root** (optional shortcut after root `yarn install`):

```bash
yarn demo:install
```

Build the matcher and viewer packages first if you have not already (`yarn build` from the repo root), so `file:` installs see up-to-date `dist/` outputs.

## Run tests

From **`demo/`** (or `yarn demo:test` from the repo root):

```bash
yarn test
```

Writes payloads under **`demo/.jest-canvas-mock-compare/`**.

## Open the viewer

From **`demo/`** (or `yarn demo:viewer` from the repo root):

```bash
yarn viewer
```

Prefer opening the **`http://localhost:5173/?file=…&payloadRoot=…`** link printed after a failing test (or pass with **`GEN_CANVAS_OUTPUT_ON_PASS=1`**), so **`payloadRoot`** points at **`demo/.jest-canvas-mock-compare`** on disk.

## Pass vs intentional failure

[`example.test.tsx`](./example.test.tsx) ships **`uPlot/passes`** and a skipped **`uPlot/fails`**. Remove `.skip` on the failing example to force a baseline mismatch and use the viewer; add `.skip` back for a simpler green repro only.
