import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  createLibraryItem,
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
