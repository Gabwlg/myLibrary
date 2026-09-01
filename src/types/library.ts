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
