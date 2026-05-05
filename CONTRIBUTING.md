# Contributing

Thanks for your interest in improving this project.

## License

This project is licensed under the [GNU Affero General Public License v3.0 only](https://www.gnu.org/licenses/agpl-3.0.en.html) (see [LICENSE](./LICENSE)). Contributions you submit will be under the same license.

## Development setup

- [Node.js](https://nodejs.org/) 20 or newer
- [Yarn](https://yarnpkg.com/) 4 (see `packageManager` in the root `package.json`)

```bash
yarn install
yarn test
yarn build
yarn lint
yarn typecheck
```

### Repository layout

- `packages/jest-canvas-mock-compare` — Jest matchers and types (small publishable surface).
- `packages/jest-canvas-mock-compare-viewer` — Vite UI and `jest-canvas-mock-compare` CLI.
- [`demo`](./demo) — Standalone Yarn project (not a root workspace) with a Jest + TS example. After `yarn install` at the repo root, run `yarn demo:install` once, then `yarn demo:test` / `yarn demo:viewer`.

Run workspace-specific scripts with `yarn workspace <package-name> <script>` for packages under `packages/*`.

## Pull requests

- Keep changes focused and match existing style (formatting, naming, test patterns).
- Add or update tests when behavior changes.
- Ensure `yarn test`, `yarn build`, `yarn lint`, and `yarn typecheck` pass locally before opening a PR.

See [PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) for the review checklist.

## Reporting issues

Use GitHub Issues and choose the bug or feature template under [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE/). For security-sensitive reports, see [SECURITY.md](./SECURITY.md).

## Releases

Published packages use semantic versioning independently (`jest-canvas-mock-compare` and `jest-canvas-mock-compare-viewer` may diverge).

Before publishing:

- Update the relevant `CHANGELOG.md` under `packages/<name>/`.
- Bump the package `version` in `package.json`.
- `prepublishOnly` runs `build` and `test` for that package.

Maintainers may adopt [Changesets](https://github.com/changesets/changesets) or another release automation workflow on the canonical GitHub repository once it is configured.
