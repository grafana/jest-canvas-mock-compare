# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Subpath **`jest-canvas-mock-compare/constants`**: **`DEFAULT_COMPARE_PAYLOAD_DIRECTORY`** without loading matchers or **`jest-canvas-mock`** (for Node tooling such as the compare viewer CLI).
- Compare viewer URLs from Jest include a **`payloadRoot`** query parameter (absolute payload directory) so the bundled UI can fetch JSON without aligning env vars beforehand.

### Changed

- **Breaking:** Remove **`JEST_CANVAS_MOCK_COMPARE_DIR`** and **`JEST_CANVAS_MOCK_COMPARE_URL`**. Payloads always write to **`{jest rootDir}/.jest-canvas-mock-compare/`**; printed viewer links always use **`http://localhost:5173/`**. **`GEN_CANVAS_OUTPUT_ON_PASS`** remains supported.

## [0.1.0] - 2026-04-30

### Added

- Initial public release: `matchers`, `scrubOutput`, and TypeScript types for canvas snapshot comparison.
- Payload output under `.jest-canvas-mock-compare/` (configurable via `JEST_CANVAS_MOCK_COMPARE_DIR`) and viewer URL hint via `JEST_CANVAS_MOCK_COMPARE_URL`.
