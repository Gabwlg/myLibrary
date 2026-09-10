# Demo mode's state lives in a module-level store, not React state or storage

The per-Item history view at `/items/[id]` needs the same in-memory progress log
the dashboard derives (docs/adr/0001). Until now that log lived in
`LibraryDashboard` component state, which unmounts when the person navigates to
another route, so a second route cannot see it — and the acceptance criteria for
the history view require that a status change made on the dashboard is visible
after navigating to `/items/[id]` and back.

We moved Demo mode's whole model — the collection and its derived progress log —
into `src/lib/library/demo-store.ts`: pure reducer functions plus a
module-level singleton exposed to React through `useSyncExternalStore`.

## Considered options

- **React Context provider in the root layout.** The idiomatic React answer, but
  it forces `LibraryDashboard`'s real-mode state (Supabase-loaded items, auth)
  through the same provider or an awkward split, and a context still needs a
  client component high in the tree. More restructuring for the same lifetime
  guarantee.
- **`sessionStorage` (or `localStorage`).** Survives navigation, but also
  survives a full reload — which contradicts `CONTEXT.md`'s definition of Demo
  mode ("nothing the person changes is persisted across a page reload... the
  progress log is derived fresh on each load").
- **A module-level store** (chosen). A module singleton's lifetime is exactly
  what Demo mode wants: shared across client-side navigation, reset on a full
  reload when the module is re-evaluated. Real mode keeps its own component
  state and simply ignores the store.

## Consequences

- The store's mutation entry points (`saveDemoItem`, `removeDemoItem`) are the
  Demo-mode equivalents of the `library-repository` write functions. The
  dashboard calls them instead of `setState` in Demo mode; their logic is pure
  and unit-tested via `saveItemInDemoState` / `removeItemFromDemoState`.
- `useSyncExternalStore` is given a dedicated frozen `SERVER_SNAPSHOT` rather
  than the live mutable state, because Next.js reuses the module across requests
  and one request's edits must not leak into another's server-rendered HTML.
  Client-side edits still show after hydration — that is `useSyncExternalStore`'s
  designed behaviour, not a mismatch.
- `removeItemFromDemoState` drops the Item's Progress events too, matching the
  real schema's `on delete cascade` on `progress_events`.
