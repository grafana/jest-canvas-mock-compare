# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- **`GET /__jest-canvas-payload__`**: serves JSON from **`payloadRoot`** + **`file`** / directory listing (**`list=1`**), matching matcher-printed links (CLI + Vite dev).

### Changed

- **Breaking:** The CLI takes **no flags**. It always listens on port **5173**, serves **`./.jest-canvas-mock-compare/`** relative to **`process.cwd()`**, and runs **`npx jest`** (no **`--config`**) for accept-baseline flows. **`JEST_CANVAS_MOCK_COMPARE_DIR`** is no longer read.
- The `file` URL query accepts a full path or `file:///…` URL; only the basename is used for fetching.

## [0.1.0] - 2026-04-30

### Added

- Initial public release: `jest-canvas-mock-compare` CLI, static viewer, and compare middleware for payload JSON from `jest-canvas-mock-compare`.
