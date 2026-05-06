# jest-canvas-mock-compare

A simple development package Jest utility aimed to make it easier to debug HTML canvas visual regression integration tests.
This package provides an additional Jest matcher `toMatchCanvasSnapshot`, and is meant to be paired with the [viewer package](https://www.npmjs.com/package/jest-canvas-mock-compare-viewer) for debugging the results of the `toMatchCanvasSnapshot` assertion visually.

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

### Environment variables

GEN_CANVAS_OUTPUT_ON_PASS: will force passed tests to emit payload files

### Public exports

- `matchers` — pass to `expect.extend(matchers)` to add `toMatchCanvasSnapshot`.
- `removeCanvasTransforms` — normalize canvas event output before comparison.
- Types: `JestCanvasMockComparePayload`, `CustomSnapshotMatchers` (for TypeScript `expect` typing).

### Payload location and viewer link

On mismatch, the matcher writes JSON under **`{jest rootDir}/.jest-canvas-mock-compare/`**. It prints a viewer URL with **`file`** and **`payloadRoot`** so [`jest-canvas-mock-compare-viewer`](https://www.npmjs.com/package/jest-canvas-mock-compare-viewer) can load that directory. The base URL is always `http://localhost:5173/`.

### CI

This library does not output anything when ran in CI (`process.env.CI`) and behaves exactly like a regular snapshot test. We're currently assuming that runtime environment should not have any impact on test behavior, so any flake in CI should be reproducible in a local environment as well.
If you are experiencing CI specific flake and would like better support for debugging failures in CI please open an issue in this repo.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
