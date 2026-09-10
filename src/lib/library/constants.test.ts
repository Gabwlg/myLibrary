import { describe, expect, it } from "vitest";

import { TERMINAL_STATUS, TYPE_STATUS_PRESETS } from "@/lib/library/constants";
import { MEDIA_TYPES } from "@/types/library";

// TERMINAL_STATUS is the lookup the "finished per month" aggregation uses to
// decide whether a Progress event is a finishing event. It must stay the last
// element of each type's TYPE_STATUS_PRESETS array (see CONTEXT.md's glossary).
describe("TERMINAL_STATUS", () => {
  it("is the final status of each type's lifecycle", () => {
    expect(TERMINAL_STATUS).toEqual({
      movie: "watched",
      book: "read",
      other: "completed",
    });
  });

  it("stays in sync with the last element of TYPE_STATUS_PRESETS", () => {
    for (const type of MEDIA_TYPES) {
      const preset = TYPE_STATUS_PRESETS[type];
      expect(TERMINAL_STATUS[type]).toBe(preset[preset.length - 1]);
    }
  });
});
