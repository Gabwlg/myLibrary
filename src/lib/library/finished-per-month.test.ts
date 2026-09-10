import { describe, expect, it } from "vitest";

import {
  barHeightPercent,
  chartMax,
  finishedPerMonth,
  formatMonthLabel,
} from "@/lib/library/finished-per-month";
import type { LibraryItem, ProgressEvent } from "@/types/library";

type EventOverrides = Partial<Pick<ProgressEvent, "itemId" | "toStatus" | "occurredAt">>;

function event(overrides: EventOverrides): Pick<ProgressEvent, "itemId" | "toStatus" | "occurredAt"> {
  return {
    itemId: "movie-1",
    toStatus: "watched",
    occurredAt: "2026-03-10T12:00:00.000Z",
    ...overrides,
  };
}

const items: Pick<LibraryItem, "id" | "type">[] = [
  { id: "movie-1", type: "movie" },
  { id: "movie-2", type: "movie" },
  { id: "book-1", type: "book" },
  { id: "other-1", type: "other" },
];

describe("finishedPerMonth", () => {
  it("returns an empty list when there are no events", () => {
    expect(finishedPerMonth([], items)).toEqual([]);
  });

  it("returns an empty list when no event reaches a Terminal status", () => {
    const events = [
      event({ itemId: "movie-1", toStatus: "watching" }),
      event({ itemId: "book-1", toStatus: "reading" }),
      event({ itemId: "other-1", toStatus: "planned" }),
    ];
    expect(finishedPerMonth(events, items)).toEqual([]);
  });

  it("counts a finishing event under the calendar month of its occurredAt", () => {
    const events = [event({ occurredAt: "2026-03-10T12:00:00.000Z" })];
    expect(finishedPerMonth(events, items)).toEqual([{ month: "2026-03", count: 1 }]);
  });

  it("sums multiple finishing events in the same month", () => {
    const events = [
      event({ itemId: "movie-1", occurredAt: "2026-03-01T00:00:00.000Z" }),
      event({ itemId: "movie-2", occurredAt: "2026-03-28T23:59:59.000Z" }),
    ];
    expect(finishedPerMonth(events, items)).toEqual([{ month: "2026-03", count: 2 }]);
  });

  it("recognises the Terminal status per type", () => {
    const events = [
      event({ itemId: "movie-1", toStatus: "watched", occurredAt: "2026-01-05T00:00:00.000Z" }),
      event({ itemId: "book-1", toStatus: "read", occurredAt: "2026-01-06T00:00:00.000Z" }),
      event({ itemId: "other-1", toStatus: "completed", occurredAt: "2026-01-07T00:00:00.000Z" }),
    ];
    expect(finishedPerMonth(events, items)).toEqual([{ month: "2026-01", count: 3 }]);
  });

  it("ignores a non-Terminal status for the Item's own type", () => {
    // "read" is Terminal for a book but not for a movie.
    const events = [event({ itemId: "movie-1", toStatus: "read" })];
    expect(finishedPerMonth(events, items)).toEqual([]);
  });

  it("ignores events whose Item is not in the provided list", () => {
    const events = [event({ itemId: "ghost", toStatus: "watched" })];
    expect(finishedPerMonth(events, items)).toEqual([]);
  });

  it("fills gap months between the first and last finishing event with zero", () => {
    const events = [
      event({ itemId: "movie-1", occurredAt: "2026-01-15T00:00:00.000Z" }),
      event({ itemId: "movie-2", occurredAt: "2026-04-02T00:00:00.000Z" }),
    ];
    expect(finishedPerMonth(events, items)).toEqual([
      { month: "2026-01", count: 1 },
      { month: "2026-02", count: 0 },
      { month: "2026-03", count: 0 },
      { month: "2026-04", count: 1 },
    ]);
  });

  it("spans a year boundary without gaps", () => {
    const events = [
      event({ itemId: "movie-1", occurredAt: "2025-11-20T00:00:00.000Z" }),
      event({ itemId: "movie-2", occurredAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(finishedPerMonth(events, items).map((entry) => entry.month)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("buckets by UTC month regardless of the timestamp's offset", () => {
    // 2026-03-31T23:00-04:00 is 2026-04-01T03:00Z, so it belongs to April.
    const events = [event({ occurredAt: "2026-03-31T23:00:00.000-04:00" })];
    expect(finishedPerMonth(events, items)).toEqual([{ month: "2026-04", count: 1 }]);
  });
});

describe("chartMax", () => {
  it("is the busiest month's count", () => {
    expect(
      chartMax([
        { month: "2026-01", count: 2 },
        { month: "2026-02", count: 5 },
        { month: "2026-03", count: 0 },
      ]),
    ).toBe(5);
  });

  it("never drops below 1, so an all-zero chart still has a scale", () => {
    expect(chartMax([{ month: "2026-01", count: 0 }])).toBe(1);
    expect(chartMax([])).toBe(1);
  });
});

describe("barHeightPercent", () => {
  it("scales a count to a percentage of the busiest month", () => {
    expect(barHeightPercent(5, 10)).toBe(50);
    expect(barHeightPercent(10, 10)).toBe(100);
  });

  it("is zero for a zero count", () => {
    expect(barHeightPercent(0, 10)).toBe(0);
  });

  it("floors a non-zero count at 4% so a lone finish stays visible", () => {
    expect(barHeightPercent(1, 100)).toBe(4);
  });

  it("is zero when there is no scale", () => {
    expect(barHeightPercent(3, 0)).toBe(0);
  });
});

describe("formatMonthLabel", () => {
  it("renders a YYYY-MM month as a short month and year", () => {
    expect(formatMonthLabel("2026-08")).toBe("Aug 2026");
  });

  it("returns the input unchanged when it is not a valid month", () => {
    expect(formatMonthLabel("not-a-month")).toBe("not-a-month");
  });
});
