import type { ItemSuggestion, MediaType } from "@/types/library";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w300";

function mapOpenLibrary(doc: Record<string, unknown>): ItemSuggestion {
  const coverId = typeof doc.cover_i === "number" ? doc.cover_i : undefined;
  return {
    id: String(doc.key ?? crypto.randomUUID()),
    title: String(doc.title ?? "Untitled"),
    creator: Array.isArray(doc.author_name) ? String(doc.author_name[0] ?? "") : undefined,
    year: typeof doc.first_publish_year === "number" ? doc.first_publish_year : undefined,
    imageUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined,
  };
}

export async function searchSuggestions(type: MediaType, query: string): Promise<ItemSuggestion[]> {
  if (!query.trim()) return [];

  if (type === "book") {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=6`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { docs?: Record<string, unknown>[] };
    return (data.docs ?? []).slice(0, 6).map(mapOpenLibrary);
  }

  if (type === "movie") {
    const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!key) {
      return [
        {
          id: "tmdb-placeholder",
          title: `${query} (TMDB integration ready)`,
          creator: "Connect NEXT_PUBLIC_TMDB_API_KEY",
        },
      ];
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&page=1`,
      { cache: "no-store" },
    );

    if (!response.ok) return [];
    const data = (await response.json()) as {
      results?: Array<{
        id: number;
        title?: string;
        release_date?: string;
        poster_path?: string;
      }>;
    };

    return (data.results ?? []).slice(0, 6).map((result) => ({
      id: String(result.id),
      title: result.title ?? "Untitled",
      year: result.release_date ? Number(result.release_date.slice(0, 4)) : undefined,
      imageUrl: result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : undefined,
    }));
  }

  return [];
}
