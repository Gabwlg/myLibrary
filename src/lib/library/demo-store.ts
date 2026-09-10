import { useSyncExternalStore } from "react";

import type { LibraryItem, ProgressEvent } from "@/types/library";

import { appendDemoProgressEvent, deriveInitialProgressEvents } from "./demo-progress-log";
import { finishedPerMonth, type MonthlyFinishCount } from "./finished-per-month";
import { SAMPLE_ITEMS } from "./sample-items";

/**
 * Demo mode's whole in-memory model: the collection plus its derived progress
 * log, kept together so every consumer (the dashboard, the per-Item history
 * view) reads one consistent snapshot.
 */
export interface DemoLibraryState {
  items: LibraryItem[];
  progressEvents: ProgressEvent[];
}

/**
 * The baseline Demo-mode state: the fixed sample collection and one initial
 * Progress event per Item. Deterministic — the derived event ids come from the
 * Item ids (see `demo-progress-log`) — so it is safe to build on both the server
 * and the client without a hydration mismatch.
 */
export function initialDemoState(): DemoLibraryState {
  return {
    items: SAMPLE_ITEMS,
    progressEvents: deriveInitialProgressEvents(SAMPLE_ITEMS),
  };
}

/**
 * Insert or update an Item and mirror the change into the progress log: a new
 * Item gains its initial `null -> status` event, an edited one a transition only
 * if its status actually moved. Prior events are never mutated or dropped.
 */
export function saveItemInDemoState(state: DemoLibraryState, item: LibraryItem): DemoLibraryState {
  const existing = state.items.find((candidate) => candidate.id === item.id);
  const items = existing
    ? state.items.map((candidate) => (candidate.id === item.id ? item : candidate))
    : [item, ...state.items];
  const progressEvents = appendDemoProgressEvent(
    state.progressEvents,
    item,
    existing ? existing.status : null,
  );
  return { items, progressEvents };
}

/**
 * Remove an Item and its Progress events, matching the real schema's
 * `on delete cascade` on `progress_events` (see `supabase/schema.sql`).
 */
export function removeItemFromDemoState(state: DemoLibraryState, id: string): DemoLibraryState {
  return {
    items: state.items.filter((item) => item.id !== id),
    progressEvents: state.progressEvents.filter((event) => event.itemId !== id),
  };
}

/**
 * One Item and its progress log from a Demo-mode snapshot, ready for the history
 * view. Keeps the "find the Item, filter its events" walk next to the state it
 * reads rather than in the component. `events` are already oldest-first: the
 * baseline is built in Item order and every change is appended.
 */
export function selectItemHistory(
  state: DemoLibraryState,
  itemId: string,
): { item: LibraryItem | null; events: ProgressEvent[] } {
  return {
    item: state.items.find((candidate) => candidate.id === itemId) ?? null,
    events: state.progressEvents.filter((event) => event.itemId === itemId),
  };
}

/**
 * The "finished per month" chart data for a Demo-mode snapshot: the same
 * aggregation real mode runs over its `progress_events` query, here over the
 * derived in-memory log. Keeps the walk next to the state it reads, matching
 * `selectItemHistory`.
 */
export function selectFinishedPerMonth(state: DemoLibraryState): MonthlyFinishCount[] {
  return finishedPerMonth(state.progressEvents, state.items);
}

// A module-level store, not React state or `sessionStorage`: Demo mode must
// survive client-side navigation between `/` and `/items/[id]` but reset on a
// full reload (docs/adr/0003), which is exactly a module singleton's lifetime.
let state: DemoLibraryState = initialDemoState();
const listeners = new Set<() => void>();

// A stable snapshot returned for the server and during hydration. Returning the
// live mutable `state` there would risk one request's edits leaking into
// another's SSR output, since Next.js reuses this module across requests. It is
// created once and never mutated (nothing here writes to it).
const SERVER_SNAPSHOT: DemoLibraryState = initialDemoState();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveDemoItem(item: LibraryItem): void {
  state = saveItemInDemoState(state, item);
  emit();
}

export function removeDemoItem(id: string): void {
  state = removeItemFromDemoState(state, id);
  emit();
}

/** Subscribe a React component to the Demo-mode collection and progress log. */
export function useDemoLibrary(): DemoLibraryState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_SNAPSHOT,
  );
}
