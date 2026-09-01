import type { LibraryItem } from "@/types/library";

export const SAMPLE_ITEMS: LibraryItem[] = [
  {
    id: "c4a6dfcc-1942-47a6-9f89-bf7e5f52be8d",
    type: "movie",
    title: "Dune: Part Two",
    creator: "Denis Villeneuve",
    year: 2024,
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
    status: "to watch",
    tags: ["sci-fi", "epic"],
    rating: 5,
    createdAt: "2026-08-16T12:30:00.000Z",
    movieInfo: { director: "Denis Villeneuve", runtimeMinutes: 166 },
  },
  {
    id: "5f3d9d29-51d5-4a0f-9a8f-a2c7496d6b6d",
    type: "book",
    title: "The Name of the Wind",
    creator: "Patrick Rothfuss",
    year: 2007,
    imageUrl:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80",
    status: "reading",
    tags: ["fantasy"],
    rating: 4,
    notes: "Great worldbuilding.",
    createdAt: "2026-08-09T09:10:00.000Z",
    bookInfo: { author: "Patrick Rothfuss", pageCount: 662 },
  },
  {
    id: "0c1f99a4-ef95-4a6f-9abc-aa4f73801519",
    type: "other",
    title: "The Last of Us",
    creator: "Naughty Dog",
    year: 2013,
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    status: "planned",
    tags: ["game"],
    createdAt: "2026-08-22T20:50:00.000Z",
  },
];
