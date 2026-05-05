# jest-canvas-mock-compare-viewer

CLI and static web UI for visualizing canvas snapshot diffs produced by [`jest-canvas-mock-compare`](https://www.npmjs.com/package/jest-canvas-mock-compare).

**License:** [AGPL-3.0-only](./LICENSE)

## Install

Requires Node.js 20+.

```bash
npm install --save-dev jest-canvas-mock-compare-viewer
```

or

```bash
yarn add --D jest-canvas-mock-compare-viewer
```

You can run the CLI without installing the package in your project (the published binary name is `jest-canvas-mock-compare`):

```bash
npx jest-canvas-mock-compare
```

## CLI

The `jest-canvas-mock-compare` command takes **no arguments**. Run it from your **consumer project root** (the same directory you use for Jest, where `package.json` usually lives). It:

- Listens on **http://localhost:5173/** (fixed port).
- Serves compare payloads from **`./.jest-canvas-mock-compare/`** relative to the current working directory.
- Runs **`npx jest`** from that directory for “Accept baseline” flows (Jest discovers config automatically).

The compare URL printed by failing tests includes **`payloadRoot`** (absolute payload directory); the bundled server exposes `GET /__jest-canvas-payload__` to read files from that path. **Treat this mode as trusted/local dev only** — do not expose the viewer on an untrusted production network.

Links look like:

```text
http://localhost:5173/?file=<basename>.json&payloadRoot=<url-encoded-abs-dir>
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
