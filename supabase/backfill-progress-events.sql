-- myLibrary — one-time backfill of Progress events for pre-existing Items
--
-- Context: progress_events (see schema.sql and
-- docs/adr/0001-status-derived-from-progress-events.md) is an append-only log of
-- status transitions, and items.status is a trigger-maintained cache of the most
-- recent event. Items created before that log existed have a real items.status
-- but zero progress_events rows, which would leave a blank gap at the start of
-- their history once the history view and stats chart ship.
--
-- This script synthesises the missing first event for each such Item: a status
-- transition from no prior status (from_status = null) to the Item's current
-- status, timed at the Item's creation.
--
-- When to run: once, after schema.sql (specifically the progress_events table
-- and trg_set_item_status trigger) has been applied to the production database,
-- and before relying on any Item's history being complete. Paste it into the
-- Supabase SQL editor, matching this repo's convention for schema changes.
--
-- Safe to re-run: the `not exists` clause skips any Item that already has a
-- progress_events row (from an earlier run or the live write path). The
-- trg_set_item_status trigger fires per row and re-sets items.status to the
-- value it already holds — a harmless no-op.

insert into public.progress_events (item_id, from_status, to_status, occurred_at)
select items.id, null, items.status, items.created_at
from public.items
where not exists (
  select 1 from public.progress_events
  where progress_events.item_id = items.id
);
