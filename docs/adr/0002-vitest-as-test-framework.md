# Vitest is the test framework

The repo had no test runner at all — no `test` script, no config, no `*.test.*`
files. Upcoming work (the progress-event write path, demo-mode progress-log
derivation) needs automated tests, so a runner had to land first. We chose
Vitest over Jest: it reads the project's existing TypeScript and ESM setup with
no extra transform config, and its Vite-style config file lets us reuse the
`@/*` path alias directly.

## Considered options

- **Jest.** The incumbent default, but needs `ts-jest`/Babel wiring and a
  separate module-resolution story for the `@/*` alias and ESM. More moving
  parts for no gain on a greenfield test setup.
- **Node's built-in `node:test`.** Zero dependencies, but no watch-mode
  ergonomics, weaker assertion output, and no first-class TypeScript/alias
  resolution — every test would need a loader flag.
- **Vitest** (chosen). One dev dependency, config in `vitest.config.ts`,
  `npm test` -> `vitest run`.

## Consequences

- **Pinned to the v3 line (`^3.2.7`), not the latest v5.** Vitest 5 has a
  peer requirement of `@types/node@>=22`, and this project pins
  `@types/node@^20` (Next.js 16's supported range). v3 is the newest Vitest
  line whose `@types/node` peer (`^18 || ^20 || >=22`) is satisfied without
  touching that constraint. Revisit when `@types/node` is bumped.
- **No DOM environment, no React plugin, `.test.ts` only.** The first tests are
  plain logic. `jsdom`/`@testing-library/react` and `@vitejs/plugin-react`
  should be added by the first ticket that actually renders a component — at
  which point `test.include` in `vitest.config.ts` must also be widened to
  `.test.tsx`, or those tests silently won't run.
- `vitest.config.ts` duplicates the `@/* -> src/*` alias from `tsconfig.json`.
  Vitest does not read `tsconfig` paths, so the two must be kept in sync by
  hand (or `vite-tsconfig-paths` added later).
