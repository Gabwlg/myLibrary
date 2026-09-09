import { describe, expect, it } from "vitest";

import { MEDIA_TYPES } from "@/types/library";

// Seed test: proves the Vitest runner is wired up end to end against real
// source. See docs/adr/0002-vitest-as-test-framework.md.
describe("MEDIA_TYPES", () => {
  it("is exactly movie, book, other in order", () => {
    expect([...MEDIA_TYPES]).toEqual(["movie", "book", "other"]);
  });
});
