import { describe, expect, it } from "vitest";

import { formatEventTime, transitionLabel } from "@/lib/library/progress-format";

describe("transitionLabel", () => {
  it("joins from-status and to-status with an arrow", () => {
    expect(transitionLabel({ fromStatus: "reading", toStatus: "read" })).toBe("reading → read");
  });

  it("renders an em dash for the initial event's null from-status", () => {
    expect(transitionLabel({ fromStatus: null, toStatus: "to read" })).toBe("— → to read");
  });
});

describe("formatEventTime", () => {
  it("formats an ISO timestamp in the given locale and time zone", () => {
    expect(
      formatEventTime("2026-08-16T12:30:00.000Z", { locale: "en-US", timeZone: "UTC" }),
    ).toBe("Aug 16, 2026, 12:30 PM");
  });

  it("defaults to a fixed locale and UTC so server and client agree", () => {
    // No options: must not depend on the runtime's locale or time zone.
    expect(formatEventTime("2026-08-16T12:30:00.000Z")).toBe("Aug 16, 2026, 12:30 PM");
  });

  it("returns the input unchanged when it is not a valid date", () => {
    expect(formatEventTime("not-a-date")).toBe("not-a-date");
  });
});
