import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  createLibraryItem,
  fetchLibraryItem,
  fetchProgressEvents,
  progressEventForStatusChange,
  updateLibraryItem,
} from "@/lib/supabase/library-repository";
import type { LibraryItem } from "@/types/library";

// Status is derived from the progress-event log (docs/adr/0001), so an Item edit
// only records an event when the status actually moved. These cases pin the
// decision `updateLibraryItem` delegates to this helper.
describe("progressEventForStatusChange", () => {
  it("returns null when the status is unchanged", () => {
    expect(progressEventForStatusChange("item-1", "reading", "reading")).toBeNull();
  });

  it("returns one event carrying the previous and next status when it changed", () => {
    expect(progressEventForStatusChange("item-1", "reading", "read")).toEqual({
      item_id: "item-1",
      from_status: "reading",
      to_status: "read",
    });
  });
});

type QueryCall = { table: string; method: string; args: unknown[] };

/**
 * Minimal stand-in for the Supabase query builder: every chained call is
 * recorded, and both `.single()` and awaiting a chain resolve to `{ data, error }`.
 * Enough surface for the repository's insert/update/upsert/delete chains.
 */
function createFakeSupabase(itemRow: Record<string, unknown> = { id: "row-id" }) {
  const calls: QueryCall[] = [];

  const from = (table: string) => {
    const result = { data: itemRow, error: null };
    const record =
      (method: string) =>
      (...args: unknown[]) => {
        calls.push({ table, method, args });
        return chain;
      };
    const chain = {
      insert: record("insert"),
      update: record("update"),
      upsert: record("upsert"),
      delete: record("delete"),
      eq: record("eq"),
      select: record("select"),
      single: () => Promise.resolve(result),
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    return chain;
  };

  return {
    client: { from } as unknown as SupabaseClient,
    calls,
    progressEventInserts: () =>
      calls.filter((call) => call.table === "progress_events" && call.method === "insert"),
    itemsUpdate: () => calls.find((call) => call.table === "items" && call.method === "update"),
  };
}

const baseItem: LibraryItem = {
  id: "item-1",
  type: "other",
  title: "Test item",
  status: "reading",
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("updateLibraryItem", () => {
  it("never writes status directly on the items update", async () => {
    const fake = createFakeSupabase();

    await updateLibraryItem(fake.client, { ...baseItem, status: "read" }, "reading");

    expect(fake.itemsUpdate()?.args[0]).not.toHaveProperty("status");
  });

  it("appends exactly one progress event when the status changed", async () => {
    const fake = createFakeSupabase();

    await updateLibraryItem(fake.client, { ...baseItem, status: "read" }, "reading");

    expect(fake.progressEventInserts()).toHaveLength(1);
    expect(fake.progressEventInserts()[0].args[0]).toEqual({
      item_id: "item-1",
      from_status: "reading",
      to_status: "read",
    });
  });

  it("appends no progress event when the status is unchanged", async () => {
    const fake = createFakeSupabase();

    await updateLibraryItem(fake.client, { ...baseItem, status: "reading" }, "reading");

    expect(fake.progressEventInserts()).toHaveLength(0);
  });
});

describe("createLibraryItem", () => {
  it("seeds exactly one progress event with a null from_status", async () => {
    const fake = createFakeSupabase({ id: "seed-id" });

    await createLibraryItem(fake.client, { ...baseItem, status: "to read" }, "user-1");

    expect(fake.progressEventInserts()).toHaveLength(1);
    expect(fake.progressEventInserts()[0].args[0]).toEqual({
      item_id: "seed-id",
      from_status: null,
      to_status: "to read",
    });
  });
});

/**
 * A stand-in for a read chain that ends in `.order(...)` and resolves to a list
 * of rows, e.g. `from("progress_events").select("*").eq(...).order(...)`.
 */
function createFakeReadSupabase(rows: Record<string, unknown>[]) {
  const calls: QueryCall[] = [];
  const record =
    (table: string, method: string) =>
    (...args: unknown[]) => {
      calls.push({ table, method, args });
      return chain;
    };
  const chain: Record<string, unknown> = {};
  const from = (table: string) => {
    chain.select = record(table, "select");
    chain.eq = record(table, "eq");
    chain.order = record(table, "order");
    chain.maybeSingle = () => Promise.resolve({ data: rows[0] ?? null, error: null });
    chain.then = (resolve: (value: { data: unknown; error: null }) => unknown) =>
      resolve({ data: rows, error: null });
    return chain;
  };

  return { client: { from } as unknown as SupabaseClient, calls };
}

describe("fetchProgressEvents", () => {
  const rows = [
    {
      id: "evt-2",
      item_id: "item-1",
      from_status: "to read",
      to_status: "reading",
      occurred_at: "2026-02-01T00:00:00.000Z",
      created_at: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "evt-1",
      item_id: "item-1",
      from_status: null,
      to_status: "to read",
      occurred_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ];

  it("queries progress_events for the Item, oldest first", async () => {
    const fake = createFakeReadSupabase([]);

    await fetchProgressEvents(fake.client, "item-1");

    expect(fake.calls).toEqual([
      { table: "progress_events", method: "select", args: ["*"] },
      { table: "progress_events", method: "eq", args: ["item_id", "item-1"] },
      { table: "progress_events", method: "order", args: ["occurred_at", { ascending: true }] },
      { table: "progress_events", method: "order", args: ["created_at", { ascending: true }] },
    ]);
  });

  it("maps snake_case rows to the camelCase ProgressEvent shape, null from_status included", async () => {
    const fake = createFakeReadSupabase(rows);

    const events = await fetchProgressEvents(fake.client, "item-1");

    expect(events).toEqual([
      {
        id: "evt-2",
        itemId: "item-1",
        fromStatus: "to read",
        toStatus: "reading",
        occurredAt: "2026-02-01T00:00:00.000Z",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "evt-1",
        itemId: "item-1",
        fromStatus: null,
        toStatus: "to read",
        occurredAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("returns an empty list for an Item with no recorded events", async () => {
    const fake = createFakeReadSupabase([]);

    await expect(fetchProgressEvents(fake.client, "item-1")).resolves.toEqual([]);
  });
});

describe("fetchLibraryItem", () => {
  it("maps the row when the Item exists", async () => {
    const fake = createFakeReadSupabase([{ id: "item-1", type: "book", title: "Found" }]);

    const item = await fetchLibraryItem(fake.client, "item-1");

    expect(fake.calls).toEqual([
      { table: "items", method: "select", args: ["*"] },
      { table: "items", method: "eq", args: ["id", "item-1"] },
    ]);
    expect(item).toMatchObject({ id: "item-1", type: "book", title: "Found" });
  });

  it("returns null when no row matches", async () => {
    const fake = createFakeReadSupabase([]);

    await expect(fetchLibraryItem(fake.client, "missing")).resolves.toBeNull();
  });
});
