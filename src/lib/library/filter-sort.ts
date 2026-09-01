import type { LibraryItem, LibraryStatus, MediaType, SortOption } from "@/types/library";

export interface DashboardFilters {
  query: string;
  type: "all" | MediaType;
  status: "all" | LibraryStatus;
  sort: SortOption;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  query: "",
  type: "all",
  status: "all",
  sort: "date-desc",
};

export function applyFilters(items: LibraryItem[], filters: DashboardFilters): LibraryItem[] {
  return [...items]
    .filter((item) => {
      const query = filters.query.trim().toLowerCase();
      if (!query) return true;
      return item.title.toLowerCase().includes(query);
    })
    .filter((item) => (filters.type === "all" ? true : item.type === filters.type))
    .filter((item) => (filters.status === "all" ? true : item.status === filters.status))
    .sort((a, b) => {
      switch (filters.sort) {
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-desc":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
}
