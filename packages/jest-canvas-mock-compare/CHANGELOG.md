# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-19

### Added

- BREAKING CHANGE: Serialize jest mocks in jest-canvas-mock snapshot output (e.g. CanvasGradient)

## [0.0.2] - 2026-05-07

### Initial release

- Initial public release: `matchers`, `removeCanvasTransforms`, and TypeScript types for canvas snapshot comparison.
- Payload output under `.jest-canvas-mock-compare/` (configurable via `JEST_CANVAS_MOCK_COMPARE_DIR`) and viewer URL hint via `JEST_CANVAS_MOCK_COMPARE_URL`.
