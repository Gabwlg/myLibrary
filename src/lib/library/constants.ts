import type { ItemFormValues, LibraryStatus, MediaType } from "@/types/library";

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Movie",
  book: "Book",
  other: "Other",
};

export const STATUS_OPTIONS: LibraryStatus[] = [
  "to watch",
  "watching",
  "watched",
  "to read",
  "reading",
  "read",
  "planned",
  "completed",
];

export const TYPE_STATUS_PRESETS: Record<MediaType, LibraryStatus[]> = {
  movie: ["to watch", "watching", "watched"],
  book: ["to read", "reading", "read"],
  other: ["planned", "completed"],
};

const lastOf = (statuses: LibraryStatus[]): LibraryStatus => statuses[statuses.length - 1];

/**
 * Each type's Terminal status — the last Status in its lifecycle, reaching which
 * is what "finished" means (see CONTEXT.md's glossary). Derived from the final
 * element of `TYPE_STATUS_PRESETS` so the two can never drift apart.
 *
 * The sole consumer is the "finished per month" stats aggregation: it turns
 * "is this Progress event a finishing event" into a lookup instead of an ad hoc
 * recomputation. It is deliberately not generalised beyond that one use.
 */
export const TERMINAL_STATUS: Record<MediaType, LibraryStatus> = {
  movie: lastOf(TYPE_STATUS_PRESETS.movie),
  book: lastOf(TYPE_STATUS_PRESETS.book),
  other: lastOf(TYPE_STATUS_PRESETS.other),
};

export const EMPTY_FORM_VALUES: ItemFormValues = {
  type: "movie",
  title: "",
  creator: "",
  year: "",
  imageUrl: "",
  status: "to watch",
  rating: "",
  tags: "",
  notes: "",
  director: "",
  runtimeMinutes: "",
  author: "",
  pageCount: "",
};
