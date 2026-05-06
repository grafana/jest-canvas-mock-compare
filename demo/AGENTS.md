## Do not (will “re-wed” the demo to the monorepo)

- Add `demo` to the **repository root** `workspaces` array — the demo must stay a standalone Yarn project with its own `yarn install` / `yarn.lock`.
- Drop **devDependencies** here and assume packages come from the monorepo root `node_modules` hoisting.

## Do

- Declare **all** Jest, React, Testing Library, and app deps needed to run tests in **this** `package.json`.
- After changing dependencies, run **`yarn install`** inside **`demo/`** so `demo/yarn.lock` stays accurate.
- Keep **`resolutions.jest-canvas-mock-compare`** pinned to **`file:../packages/jest-canvas-mock-compare`** while the viewer depends on the matcher via semver and the package is not on the public registry (so Yarn does not try to fetch it from npm). Remove or replace when both packages are published and the demo uses registry versions.
