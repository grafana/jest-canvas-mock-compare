# jest-canvas-mock-compare

Jest matchers that compare [jest-canvas-mock](https://www.npmjs.com/package/jest-canvas-mock) recording scripts as snapshots, with JSON payloads for a separate compare viewer when diffs fail.

**License:** [AGPL-3.0-only](./LICENSE)

## Install

Requires Node.js 20+.

```bash
npm install --save-dev jest-canvas-mock-compare
```

or

```bash
yarn add --D jest-canvas-mock-compare
```

Peer dependencies: `jest` >= 29, `jest-canvas-mock` >= 2.5, `jest-snapshot` >= 29.

## Usage

```ts
import { matchers, removeCanvasTransforms } from 'jest-canvas-mock-compare';

expect.extend(matchers);

const width = 400;
const height = 400;
// removeCanvasTransforms(...) prepares canvas events; then:
expect(removeCanvasTransforms(actualEvents)).toMatchCanvasSnapshot(expectedEvents, { width, height });
```

To make the `toMatchCanvasSnapshot` jest expect extension available across an entire repo, extend the jest matchers in your global [Jest setup file](https://jestjs.io/docs/configuration).

### Public exports

- `matchers` — pass to `expect.extend(matchers)` to add `toMatchCanvasSnapshot`.
- `scrubOutput` — normalize canvas event output before comparison.
- Types: `JestCanvasMockComparePayload`, `CustomSnapshotMatchers` (for TypeScript `expect` typing).

### Payload location and viewer link

On mismatch (or when **`GEN_CANVAS_OUTPUT_ON_PASS`** is set), the matcher writes JSON under **`{jest rootDir}/.jest-canvas-mock-compare/`**. It prints a viewer URL with **`file`** and **`payloadRoot`** so [`jest-canvas-mock-compare-viewer`](https://www.npmjs.com/package/jest-canvas-mock-compare-viewer) can load that directory. The base URL is always `http://localhost:5173/`.

In **plain Node** (for example the viewer CLI), import **`jest-canvas-mock-compare/constants`** for **`DEFAULT_COMPARE_PAYLOAD_DIRECTORY`** only. Importing the package root loads **`jest-canvas-mock`**, which expects Jest globals and fails outside a test run.

### CI

This library does not output anything when ran in CI (process.env.CI) and behaves exactly like a regular snapshot test. We're currently assuming that
If you are experiencing CI specific flake and would like better tooling (i.e. dump) please open an issue in this repo and we'll

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
