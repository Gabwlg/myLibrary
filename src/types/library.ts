export const MEDIA_TYPES = ["movie", "book", "other"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export type LibraryStatus =
  | "to watch"
  | "watching"
  | "watched"
  | "to read"
  | "reading"
  | "read"
  | "planned"
  | "completed";

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

export interface LibraryItem {
  id: string;
  userId?: string;
  type: MediaType;
  title: string;
  creator?: string;
  year?: number;
  imageUrl?: string;
  status: LibraryStatus;
  notes?: string;
  rating?: number;
  tags: string[];
  createdAt: string;
  movieInfo?: {
    director?: string;
    runtimeMinutes?: number;
  };
  bookInfo?: {
    author?: string;
    pageCount?: number;
  };
}

/**
 * One recorded status transition in an Item's progress log. The log is the
 * source of truth for `LibraryItem.status`; see
 * docs/adr/0001-status-derived-from-progress-events.md. `fromStatus` is null for
 * the first event of a newly added Item, which has no prior status.
 */
export interface ProgressEvent {
  id: string;
  itemId: string;
  fromStatus: LibraryStatus | null;
  toStatus: LibraryStatus;
  occurredAt: string;
  createdAt: string;
}

export interface ItemSuggestion {
  id: string;
  title: string;
  creator?: string;
  year?: number;
  imageUrl?: string;
}

export interface ItemFormValues {
  type: MediaType;
  title: string;
  creator: string;
  year: string;
  imageUrl: string;
  status: LibraryStatus;
  rating: string;
  tags: string;
  notes: string;
  director: string;
  runtimeMinutes: string;
  author: string;
  pageCount: string;
}
