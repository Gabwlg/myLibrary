import type { ProgressEvent } from "@/types/library";

/**
 * How a single Progress event reads in the history timeline, e.g.
 * `"reading → read"`. The first event of an Item has no prior status
 * (`fromStatus` is null), rendered as an em dash: `"— → to read"`.
 */
export function transitionLabel(event: Pick<ProgressEvent, "fromStatus" | "toStatus">): string {
  return `${event.fromStatus ?? "—"} → ${event.toStatus}`;
}

/**
 * A human-readable absolute timestamp for a Progress event's `occurredAt` (an
 * ISO 8601 string). Both `locale` and `timeZone` default to fixed values
 * (`en-US`, `UTC`) rather than the runtime's own: the history view is a client
 * component that renders on the server and again on hydration, and a
 * runtime-dependent format would differ between the two. Callers that want a
 * localized display pass their own values. An unparseable input is returned
 * unchanged rather than shown as "Invalid Date".
 */
export function formatEventTime(
  occurredAt: string,
  options: { locale?: string; timeZone?: string } = {},
): string {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return occurredAt;
  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: options.timeZone ?? "UTC",
  }).format(date);
}
