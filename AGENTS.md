# Maintainer notes for automation / agents

## `demo/` is not a Yarn workspace

The [`demo/`](./demo) directory is a **separate Yarn project** (its own `package.json` and `yarn.lock`) that shows how consumers wire up Jest and the published packages. It must **not** be added to the root `workspaces` array in [`package.json`](./package.json).

Dependency rules for that folder live in [`demo/AGENTS.md`](./demo/AGENTS.md). When changing demo wiring or root workspaces, read that file first.
