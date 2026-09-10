import { describe, expect, it } from "vitest";

import {
  appendDemoProgressEvent,
  deriveInitialProgressEvents,
} from "@/lib/library/demo-progress-log";
import { SAMPLE_ITEMS } from "@/lib/library/sample-items";
import type { LibraryItem } from "@/types/library";

const book: LibraryItem = {
  id: "item-1",
  type: "book",
  title: "Test book",
  status: "to read",
  tags: [],
  createdAt: "2026-01-02T03:04:05.000Z",
};

// The baseline log Demo mode derives on load must match the real-mode Backfill's
// SQL rule (docs/adr/0001): one `null -> current status` event per Item, timed
// to the Item's creation.
describe("deriveInitialProgressEvents", () => {
  it("produces one event per Item, in order, from SAMPLE_ITEMS", () => {
    const events = deriveInitialProgressEvents(SAMPLE_ITEMS);

    expect(events).toHaveLength(SAMPLE_ITEMS.length);
    events.forEach((event, index) => {
      const source = SAMPLE_ITEMS[index];
      expect(event.itemId).toBe(source.id);
      expect(event.fromStatus).toBeNull();
      expect(event.toStatus).toBe(source.status);
      expect(event.occurredAt).toBe(source.createdAt);
    });
  });

  it("derives ids deterministically so SSR and hydration agree", () => {
    expect(deriveInitialProgressEvents(SAMPLE_ITEMS).map((event) => event.id)).toEqual(
      deriveInitialProgressEvents(SAMPLE_ITEMS).map((event) => event.id),
    );
    expect(new Set(deriveInitialProgressEvents(SAMPLE_ITEMS).map((event) => event.id)).size).toBe(
      SAMPLE_ITEMS.length,
    );
  });

  it("applies the same rule to a single Item", () => {
    expect(deriveInitialProgressEvents([book])[0]).toMatchObject({
      itemId: "item-1",
      fromStatus: null,
      toStatus: "to read",
      occurredAt: "2026-01-02T03:04:05.000Z",
    });
  });
});

describe("appendDemoProgressEvent", () => {
  it("appends a status transition without mutating or dropping prior events", () => {
    const baseline = deriveInitialProgressEvents(SAMPLE_ITEMS);
    const target = SAMPLE_ITEMS[0];

    const next = appendDemoProgressEvent(baseline, { ...target, status: "watching" }, target.status);

    expect(baseline).toHaveLength(SAMPLE_ITEMS.length);
    expect(next).toHaveLength(baseline.length + 1);
    expect(next.slice(0, baseline.length)).toEqual(baseline);
    expect(next.at(-1)).toMatchObject({
      itemId: target.id,
      fromStatus: target.status,
      toStatus: "watching",
    });
  });

  it("appends an initial event when a new Item is added (previousStatus null)", () => {
    const baseline = deriveInitialProgressEvents(SAMPLE_ITEMS);
    const added: LibraryItem = { ...book, id: "new-item", status: "reading" };

    const next = appendDemoProgressEvent(baseline, added, null);

    expect(next).toHaveLength(baseline.length + 1);
    expect(next.at(-1)).toMatchObject({
      itemId: "new-item",
      fromStatus: null,
      toStatus: "reading",
      occurredAt: book.createdAt,
    });
  });

  it("leaves the log unchanged when an edit did not move the status", () => {
    const baseline = deriveInitialProgressEvents(SAMPLE_ITEMS);
    const target = SAMPLE_ITEMS[1];

    const next = appendDemoProgressEvent(baseline, { ...target, title: "Renamed" }, target.status);

    expect(next).toBe(baseline);
  });
});
