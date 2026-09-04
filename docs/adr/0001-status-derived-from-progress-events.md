# Item status is derived from the progress-event log, not stored directly

We're introducing `progress_events`, an append-only log of status transitions, to
power the stats page's "finished per month" chart and a per-Item history view.
Once that log exists, `items.status` could either stay the authoritative value
(events are a side-record written alongside it) or become a read-only reflection
of the log's most recent event. We chose the latter: `items.status` is a
denormalized cache, kept in sync by a database trigger on `progress_events`, and
no application code writes it directly except once, at Item creation, to satisfy
the column's `NOT NULL` constraint before that Item's first event exists.

## Considered options

- **Status stays authoritative, events are a side-record.** Simpler and fully
  reversible, but leaves two places that can disagree about an Item's current
  status, with no enforced relationship between them.
- **Status is a SQL view over the latest event, `items.status` dropped
  entirely.** No denormalization at all, but rewrites every consumer of
  `item.status` (dashboard query, `filter-sort.ts` sorting, card rendering) and
  demo mode's in-memory model.
- **Status derived, kept as a trigger-maintained cache** (chosen). Every
  existing read path keeps working unchanged; the log is the single source of
  truth; the trigger is the only place consistency logic lives.

## Consequences

- The trigger sets `items.status` to whatever event was *just inserted* — it
  does not check `occurred_at`. This is only correct because v1 never lets a
  person backdate an event (the one-time Backfill is the sole exception, and it
  runs before any real logging exists). A future feature that logs past events
  out of order would silently corrupt this cache unless the trigger is revisited
  then.
- `items.status` is seeded once, redundantly, in the `INSERT INTO items`
  statement at creation time, purely to satisfy `NOT NULL` before the Item's
  first `progress_events` row (and the trigger) exist. This is the one
  documented exception to "status is never written directly" — everywhere else,
  including `updateLibraryItem`, status changes only ever happen by inserting a
  new event.
