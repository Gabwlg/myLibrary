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
