import { describe, expect, it } from "vitest";

import {
  initialDemoState,
  removeItemFromDemoState,
  saveItemInDemoState,
} from "@/lib/library/demo-store";
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

describe("initialDemoState", () => {
  it("pairs the sample collection with one initial event per Item", () => {
    const state = initialDemoState();

    expect(state.items).toBe(SAMPLE_ITEMS);
    expect(state.progressEvents).toHaveLength(SAMPLE_ITEMS.length);
    expect(state.progressEvents.map((event) => event.itemId)).toEqual(
      SAMPLE_ITEMS.map((item) => item.id),
    );
    expect(state.progressEvents.every((event) => event.fromStatus === null)).toBe(true);
  });
});

describe("saveItemInDemoState", () => {
  it("prepends a new Item and appends its initial event", () => {
    const next = saveItemInDemoState(initialDemoState(), book);

    expect(next.items[0]).toBe(book);
    expect(next.items).toHaveLength(SAMPLE_ITEMS.length + 1);
    expect(next.progressEvents.at(-1)).toMatchObject({
      itemId: "item-1",
      fromStatus: null,
      toStatus: "to read",
      occurredAt: book.createdAt,
    });
  });

  it("replaces an edited Item and appends a transition when its status moved", () => {
    const target = SAMPLE_ITEMS[0];
    const next = saveItemInDemoState(initialDemoState(), { ...target, status: "watching" });

    expect(next.items[0]).toMatchObject({ id: target.id, status: "watching" });
    expect(next.items).toHaveLength(SAMPLE_ITEMS.length);
    expect(next.progressEvents.at(-1)).toMatchObject({
      itemId: target.id,
      fromStatus: target.status,
      toStatus: "watching",
    });
  });

  it("leaves the progress log untouched when an edit did not move the status", () => {
    const base = initialDemoState();
    const target = SAMPLE_ITEMS[1];

    const next = saveItemInDemoState(base, { ...target, title: "Renamed" });

    expect(next.items.find((item) => item.id === target.id)?.title).toBe("Renamed");
    expect(next.progressEvents).toBe(base.progressEvents);
  });
});

describe("removeItemFromDemoState", () => {
  it("drops the Item and its events but keeps every other Item's history", () => {
    const removed = SAMPLE_ITEMS[0];
    const kept = SAMPLE_ITEMS[1];

    const next = removeItemFromDemoState(initialDemoState(), removed.id);

    expect(next.items.some((item) => item.id === removed.id)).toBe(false);
    expect(next.progressEvents.some((event) => event.itemId === removed.id)).toBe(false);
    expect(next.progressEvents.some((event) => event.itemId === kept.id)).toBe(true);
  });
});
