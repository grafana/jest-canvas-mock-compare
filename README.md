# jest-canvas-mock-compare

Yarn workspaces monorepo for **Jest canvas snapshot matchers** and a small **web viewer** to inspect visual diffs when
snapshots disagree.

| Package                                                                         | npm                               | Role                                                                                 |
| ------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| [`jest-canvas-mock-compare`](./packages/jest-canvas-mock-compare)               | `jest-canvas-mock-compare`        | `expect.extend(matchers)`, payloads under **`rootDir`/`.jest-canvas-mock-compare/`** |
| [`jest-canvas-mock-compare-viewer`](./packages/jest-canvas-mock-compare-viewer) | `jest-canvas-mock-compare-viewer` | CLI `jest-canvas-mock-compare` (no flags) + Vite UI                                  |

Licensed under [AGPL-3.0-only](./LICENSE).

## Quick start

Install the matcher in the project where you run Jest:

```bash
npm install --save-dev jest-canvas-mock-compare
```

or

```bash
yarn add --D jest-canvas-mock-compare
```

Register matchers once [in Jest setup file](https://jestjs.io/docs/configuration):

```ts
import { matchers } from 'jest-canvas-mock-compare';

expect.extend(matchers);
```

When a canvas snapshot fails (or when you opt in with `GEN_CANVAS_OUTPUT_ON_PASS`), the matcher writes a payload under
**`.jest-canvas-mock-compare/`** next to Jest’s project root (`rootDir`, same directory as `package.json` in typical
setups).

**Printed compare links include `payloadRoot=`**, so opening the URL from test output reaches that folder without any
extra configuration.

Request URLs accept the JSON **basename**, a pasted full path, or a `file:///…` URL; only the basename is fetched.

Run the viewer CLI when you want to explore the diff (from your project root so it reads
`./.jest-canvas-mock-compare/`):

```bash
npx --package jest-canvas-mock-compare-viewer jest-canvas-mock-compare
```

The server listens on **http://localhost:5173/** (fixed). If the viewer is already a dev dependency,
`npx jest-canvas-mock-compare` uses the local binary.

Open the URL printed in the test output (it includes `file=` and **`payloadRoot=`**).

### Sandbox / examples

Runnable example (standalone Yarn project under **[`demo/`](./demo)**): install with `yarn demo:install`, then `yarn demo:test` or `yarn demo:viewer`. The viewer package still
has its own **[`example.test.tsx`](packages/jest-canvas-mock-compare-viewer/src/example.test.tsx)** for package-local
checks.

### Jest transpilation (`transformIgnorePatterns`)

If Jest skips transpiling workspace packages, **`jest-canvas-mock-compare`** can arrive unprepared as ESM. Exclude it from
`**/node_modules`\*\* ignore transforms (patterns vary by toolchain). For example:

```javascript
transformIgnorePatterns: ['/node_modules/(?!jest-canvas-mock(?:-compare)?/)'],
```

Adjust to match **`jest`** / **`ts-jest`** / **`babel-jest`** presets in your project.

### Ignoring payloads in git

Treat compare payloads as ephemeral debug artifacts; add **`/.jest-canvas-mock-compare/`** to **`.gitignore`** while keeping
canonical **`.snap`** files committed.

## Optional environment variable

Set **`GEN_CANVAS_OUTPUT_ON_PASS`** to emit a compare payload even when the test passes (useful for refreshing baselines
or debugging).

## Developing this repo

From the repository root:

- `yarn install`
- `yarn test` — tests in matcher and viewer workspaces
- `yarn demo:install` — install dependencies for [`demo/`](./demo) (once per clone or after demo dep changes)
- `yarn demo:test` — Jest sandbox under [`demo/`](./demo)
- `yarn build` — build matcher and viewer
- `yarn dev` — run the viewer Vite dev app

See [CONTRIBUTING.md](./CONTRIBUTING.md) for workflows, releases, and how to report issues.

## Changelog

Per-package history:

- [`jest-canvas-mock-compare`](./packages/jest-canvas-mock-compare/CHANGELOG.md)
- [`jest-canvas-mock-compare-viewer`](./packages/jest-canvas-mock-compare-viewer/CHANGELOG.md)
