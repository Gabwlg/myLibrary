import type { SupabaseClient } from "@supabase/supabase-js";

import type { LibraryItem } from "@/types/library";

type SupabaseRow = Record<string, unknown>;

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapItem(row: SupabaseRow, movieInfo?: SupabaseRow, bookInfo?: SupabaseRow): LibraryItem {
  return {
    id: String(row.id),
    userId: typeof row.user_id === "string" ? row.user_id : undefined,
    type: (row.type as LibraryItem["type"]) ?? "other",
    title: String(row.title ?? "Untitled"),
    creator: typeof row.creator === "string" ? row.creator : undefined,
    year: asNumber(row.year),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    status: (row.status as LibraryItem["status"]) ?? "planned",
    notes: typeof row.notes === "string" ? row.notes : undefined,
    rating: asNumber(row.rating),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    movieInfo: movieInfo
      ? {
          director: typeof movieInfo.director === "string" ? movieInfo.director : undefined,
          runtimeMinutes: asNumber(movieInfo.runtime_minutes),
        }
      : undefined,
    bookInfo: bookInfo
      ? {
          author: typeof bookInfo.author === "string" ? bookInfo.author : undefined,
          pageCount: asNumber(bookInfo.page_count),
        }
      : undefined,
  };
}

export async function fetchLibraryItems(supabase: SupabaseClient, userId: string): Promise<LibraryItem[]> {
  const { data: rows, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const items = (rows ?? []) as SupabaseRow[];
  const ids = items.map((item) => String(item.id));

  const [movieDetails, bookDetails] = await Promise.all([
    ids.length ? supabase.from("movie_info").select("*").in("id_item", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("book_info").select("*").in("id_item", ids) : Promise.resolve({ data: [] }),
  ]);

  const movieMap = new Map((movieDetails.data ?? []).map((row) => [String((row as SupabaseRow).id_item), row as SupabaseRow]));
  const bookMap = new Map((bookDetails.data ?? []).map((row) => [String((row as SupabaseRow).id_item), row as SupabaseRow]));

  return items.map((row) => mapItem(row, movieMap.get(String(row.id)), bookMap.get(String(row.id))));
}

export async function createLibraryItem(supabase: SupabaseClient, payload: LibraryItem, userId: string): Promise<LibraryItem> {
  const { data, error } = await supabase
    .from("items")
    .insert({
      id: payload.id,
      user_id: userId,
      type: payload.type,
      title: payload.title,
      creator: payload.creator ?? null,
      year: payload.year ?? null,
      image_url: payload.imageUrl ?? null,
      status: payload.status,
      notes: payload.notes ?? null,
      rating: payload.rating ?? null,
      tags: payload.tags,
    })
    .select("*")
    .single();

  if (error) throw error;

  if (payload.type === "movie" && payload.movieInfo) {
    await supabase.from("movie_info").upsert({
      id_item: payload.id,
      director: payload.movieInfo.director ?? null,
      runtime_minutes: payload.movieInfo.runtimeMinutes ?? null,
    });
  }

  if (payload.type === "book" && payload.bookInfo) {
    await supabase.from("book_info").upsert({
      id_item: payload.id,
      author: payload.bookInfo.author ?? null,
      page_count: payload.bookInfo.pageCount ?? null,
    });
  }

  return mapItem(data as SupabaseRow, payload.movieInfo as SupabaseRow | undefined, payload.bookInfo as SupabaseRow | undefined);
}

export async function updateLibraryItem(supabase: SupabaseClient, payload: LibraryItem): Promise<LibraryItem> {
  const { data, error } = await supabase
    .from("items")
    .update({
      type: payload.type,
      title: payload.title,
      creator: payload.creator ?? null,
      year: payload.year ?? null,
      image_url: payload.imageUrl ?? null,
      status: payload.status,
      notes: payload.notes ?? null,
      rating: payload.rating ?? null,
      tags: payload.tags,
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) throw error;

  if (payload.type === "movie") {
    await supabase.from("movie_info").upsert({
      id_item: payload.id,
      director: payload.movieInfo?.director ?? null,
      runtime_minutes: payload.movieInfo?.runtimeMinutes ?? null,
    });
    await supabase.from("book_info").delete().eq("id_item", payload.id);
  }

  if (payload.type === "book") {
    await supabase.from("book_info").upsert({
      id_item: payload.id,
      author: payload.bookInfo?.author ?? null,
      page_count: payload.bookInfo?.pageCount ?? null,
    });
    await supabase.from("movie_info").delete().eq("id_item", payload.id);
  }

  if (payload.type === "other") {
    await Promise.all([
      supabase.from("movie_info").delete().eq("id_item", payload.id),
      supabase.from("book_info").delete().eq("id_item", payload.id),
    ]);
  }

  return mapItem(data as SupabaseRow, payload.movieInfo as SupabaseRow | undefined, payload.bookInfo as SupabaseRow | undefined);
}

export async function deleteLibraryItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}
