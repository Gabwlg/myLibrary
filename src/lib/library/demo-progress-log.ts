import type { LibraryItem, LibraryStatus, ProgressEvent } from "@/types/library";

/**
 * Synthesize the single Progress event an Item's current state implies when no
 * real history was recorded: a transition from no prior status straight to its
 * current one, timed to the Item's creation. This is the exact rule the
 * real-mode Backfill applies in SQL (docs/adr/0001), expressed here as plain
 * TypeScript so Demo mode can feed the same `ProgressEvent` shape to the history
 * view and stats chart without special-casing.
 *
 * The id is derived from the Item id rather than random so the baseline is
 * identical on the server and on the client — this list is built inside a
 * `useState` initializer, which runs during SSR and again on hydration.
 */
function deriveInitialProgressEvent(item: LibraryItem): ProgressEvent {
  return {
    id: `demo-initial-${item.id}`,
    itemId: item.id,
    fromStatus: null,
    toStatus: item.status,
    occurredAt: item.createdAt,
    createdAt: item.createdAt,
  };
}

/**
 * The Progress event a Demo-mode status change implies, or null when the status
 * did not actually move (the same "no event unless it moved" rule real mode's
 * `progressEventForStatusChange` applies). Unlike the initial event this carries
 * the Item's prior status as `fromStatus`, and is timed to now — the moment the
 * change was made — so its id can safely be random: it is only ever created in
 * response to a client-side edit, never during render.
 */
function deriveStatusChangeEvent(
  item: LibraryItem,
  previousStatus: LibraryStatus,
): ProgressEvent | null {
  if (previousStatus === item.status) return null;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    itemId: item.id,
    fromStatus: previousStatus,
    toStatus: item.status,
    occurredAt: now,
    createdAt: now,
  };
}

/**
 * The baseline progress log for a whole Demo-mode collection: one initial event
 * per Item, in the same order. Called once on load and again whenever the
 * collection is reset, so a page reload always lands back on this list.
 */
export function deriveInitialProgressEvents(items: LibraryItem[]): ProgressEvent[] {
  return items.map(deriveInitialProgressEvent);
}

/**
 * Extend a Demo-mode progress log for one change to an Item, never mutating or
 * dropping prior events. Pass `previousStatus: null` when the Item was just
 * added — this appends its initial `null -> status` event, the same rule as the
 * baseline. Pass the Item's prior status when an existing Item was edited — this
 * appends a transition only if the status actually moved, otherwise it returns
 * the log unchanged.
 */
export function appendDemoProgressEvent(
  log: ProgressEvent[],
  item: LibraryItem,
  previousStatus: LibraryStatus | null,
): ProgressEvent[] {
  if (previousStatus === null) {
    return [...log, deriveInitialProgressEvent(item)];
  }
  const event = deriveStatusChangeEvent(item, previousStatus);
  return event ? [...log, event] : log;
}
