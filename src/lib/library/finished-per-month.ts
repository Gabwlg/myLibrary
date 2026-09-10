import type { LibraryItem, MediaType, ProgressEvent } from "@/types/library";

import { TERMINAL_STATUS } from "./constants";

/** One column of the "finished per month" chart: a calendar month and its count. */
export interface MonthlyFinishCount {
  /** The calendar month as `YYYY-MM`, in UTC. */
  month: string;
  /** How many Items reached their type's Terminal status that month. */
  count: number;
}

/** The Progress-event fields the aggregation reads — a subset of `ProgressEvent`. */
type FinishEventInput = Pick<ProgressEvent, "itemId" | "toStatus" | "occurredAt">;

/** The Item fields the aggregation reads — enough to look a finishing event up by type. */
type FinishItemInput = Pick<LibraryItem, "id" | "type">;

/** The `YYYY-MM` calendar month of an ISO 8601 timestamp, always in UTC. */
function monthKey(occurredAt: string): string {
  const date = new Date(occurredAt);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Every `YYYY-MM` month from `start` to `end` inclusive, so the chart's x-axis
 * stays continuous across months that had no finishing events.
 */
function monthsBetween(start: string, end: string): string[] {
  const [endYear, endMonth] = end.split("-").map(Number);
  const months: string[] = [];
  let [year, month] = start.split("-").map(Number);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Group finishing events by calendar month and count them. A finishing event is
 * a Progress event whose `toStatus` is the Terminal status for its Item's type
 * (see CONTEXT.md); events for an unknown Item, or whose `toStatus` is any other
 * status, are ignored.
 *
 * The result runs from the earliest finishing month to the latest with no gaps:
 * a month in that span with no finishing events is present with `count: 0` so it
 * still occupies an axis slot. An empty collection, or one with no finishing
 * events at all, yields `[]` — the caller renders a "no data yet" state.
 *
 * Pure and rendering-independent: both Demo mode (over its derived in-memory
 * log) and real mode (over the joined `progress_events` query) call this with
 * the same two lists.
 */
export function finishedPerMonth(
  events: FinishEventInput[],
  items: FinishItemInput[],
): MonthlyFinishCount[] {
  const typeById = new Map<string, MediaType>(items.map((item) => [item.id, item.type]));

  const counts = new Map<string, number>();
  for (const event of events) {
    const type = typeById.get(event.itemId);
    if (!type || event.toStatus !== TERMINAL_STATUS[type]) continue;
    const key = monthKey(event.occurredAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) return [];

  const present = [...counts.keys()].sort();
  return monthsBetween(present[0], present[present.length - 1]).map((month) => ({
    month,
    count: counts.get(month) ?? 0,
  }));
}

/** The tallest bar the chart must fit — the busiest month's count, never below 1. */
export function chartMax(data: MonthlyFinishCount[]): number {
  return Math.max(...data.map((entry) => entry.count), 1);
}

/**
 * A month's bar height as a percentage (0–100) of the chart area, scaled to the
 * busiest month. A zero-count month is `0` (the caller draws the empty axis
 * slot); any non-zero count is floored at 4% so a single finish is still a
 * visible bar next to a much busier month.
 */
export function barHeightPercent(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.max((count / max) * 100, 4);
}

/**
 * A `YYYY-MM` month rendered for a human, e.g. `"Aug 2026"`. Locale and time
 * zone are pinned (`en-US`, `UTC`) rather than the runtime's own, because the
 * stats view is a client component that renders on the server and again on
 * hydration and a runtime-dependent format would differ between the two — the
 * same reasoning as `formatEventTime` in `progress-format.ts`.
 */
export function formatMonthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
