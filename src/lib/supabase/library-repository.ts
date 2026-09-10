import type { SupabaseClient } from "@supabase/supabase-js";

import type { LibraryItem, LibraryStatus, ProgressEvent } from "@/types/library";

type SupabaseRow = Record<string, unknown>;

/** The columns written when appending a status transition to `progress_events`. */
type ProgressEventInsert = {
  item_id: string;
  from_status: LibraryStatus | null;
  to_status: LibraryStatus;
};

/**
 * Decide the `progress_events` row an Item edit implies. `items.status` is a
 * trigger-maintained cache of this log (docs/adr/0001), so an edit records an
 * event only when the status actually moved; an unchanged status writes nothing.
 */
export function progressEventForStatusChange(
  itemId: string,
  previousStatus: LibraryStatus,
  nextStatus: LibraryStatus,
): ProgressEventInsert | null {
  if (previousStatus === nextStatus) return null;
  return { item_id: itemId, from_status: previousStatus, to_status: nextStatus };
}

/** Append one row to an Item's progress log, surfacing any write error. */
async function appendProgressEvent(supabase: SupabaseClient, row: ProgressEventInsert): Promise<void> {
  const { error } = await supabase.from("progress_events").insert(row);
  if (error) throw error;
}

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

/**
 * Map one `progress_events` row to `ProgressEvent`, snake_case -> camelCase and
 * with the same shape of fallbacks `mapItem` uses: `String(... ?? default)` for
 * the required text/timestamp columns and a bare cast for the status enums (cf.
 * `mapItem`'s `row.status as ...`). `from_status` is nullable — it is null only
 * for an Item's first event.
 */
function mapProgressEvent(row: SupabaseRow): ProgressEvent {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    fromStatus: (row.from_status as LibraryStatus | null) ?? null,
    toStatus: (row.to_status as LibraryStatus) ?? "planned",
    occurredAt: String(row.occurred_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/**
 * One Item's progress log — every recorded status transition — oldest event
 * first, so callers can render it as a top-to-bottom timeline. `items.status` is
 * a cache of this log's most recent event (docs/adr/0001).
 */
export async function fetchProgressEvents(
  supabase: SupabaseClient,
  itemId: string,
): Promise<ProgressEvent[]> {
  const { data, error } = await supabase
    .from("progress_events")
    .select("*")
    .eq("item_id", itemId)
    // `created_at` breaks ties so a backfilled creation event and a same-instant
    // transition still order by insertion, not arbitrarily.
    .order("occurred_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as SupabaseRow[]).map(mapProgressEvent);
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

/**
 * One Item by id, or null when it does not exist or is hidden by RLS. The
 * companion movie/book record is not joined — callers that only need the shared
 * fields (e.g. the history view's title) can skip that round-trip.
 */
export async function fetchLibraryItem(supabase: SupabaseClient, id: string): Promise<LibraryItem | null> {
  const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapItem(data as SupabaseRow) : null;
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

  const newItem = data as SupabaseRow;

  // Seed the Item's progress log with its first event. `from_status` is null
  // because a brand-new Item has no prior status. The trigger on this insert
  // sets `items.status`, which the seed value above already matches.
  await appendProgressEvent(supabase, {
    item_id: String(newItem.id),
    from_status: null,
    to_status: payload.status,
  });

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

  return mapItem(newItem, payload.movieInfo as SupabaseRow | undefined, payload.bookInfo as SupabaseRow | undefined);
}

export async function updateLibraryItem(
  supabase: SupabaseClient,
  payload: LibraryItem,
  previousStatus: LibraryStatus,
): Promise<LibraryItem> {
  // `status` is intentionally absent here: it is a cache derived from
  // `progress_events` (docs/adr/0001) and must never be written directly on an
  // update. A status change is recorded by appending an event below instead.
  const { data, error } = await supabase
    .from("items")
    .update({
      type: payload.type,
      title: payload.title,
      creator: payload.creator ?? null,
      year: payload.year ?? null,
      image_url: payload.imageUrl ?? null,
      notes: payload.notes ?? null,
      rating: payload.rating ?? null,
      tags: payload.tags,
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) throw error;

  const statusEvent = progressEventForStatusChange(payload.id, previousStatus, payload.status);
  if (statusEvent) await appendProgressEvent(supabase, statusEvent);

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

  // The `items` row was selected before the event above fired its trigger, so
  // its `status` column is stale. The trigger sets it to exactly the event's
  // `to_status`, i.e. `payload.status`, so reflect that in the returned Item.
  return mapItem(
    { ...(data as SupabaseRow), status: payload.status },
    payload.movieInfo as SupabaseRow | undefined,
    payload.bookInfo as SupabaseRow | undefined,
  );
}

export async function deleteLibraryItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}
