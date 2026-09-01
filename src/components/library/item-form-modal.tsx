"use client";

import { useMemo, useState } from "react";

import { EMPTY_FORM_VALUES, TYPE_STATUS_PRESETS } from "@/lib/library/constants";
import { searchSuggestions } from "@/lib/library/search-providers";
import type { ItemFormValues, ItemSuggestion, LibraryItem, MediaType } from "@/types/library";

interface ItemFormModalProps {
  open: boolean;
  item?: LibraryItem | null;
  onClose: () => void;
  onSave: (item: LibraryItem) => Promise<void>;
}

function mapItemToForm(item: LibraryItem): ItemFormValues {
  return {
    type: item.type,
    title: item.title,
    creator: item.creator ?? "",
    year: item.year ? String(item.year) : "",
    imageUrl: item.imageUrl ?? "",
    status: item.status,
    rating: item.rating ? String(item.rating) : "",
    tags: item.tags.join(", "),
    notes: item.notes ?? "",
    director: item.movieInfo?.director ?? "",
    runtimeMinutes: item.movieInfo?.runtimeMinutes ? String(item.movieInfo.runtimeMinutes) : "",
    author: item.bookInfo?.author ?? "",
    pageCount: item.bookInfo?.pageCount ? String(item.bookInfo.pageCount) : "",
  };
}

export function ItemFormModal({ open, item, onClose, onSave }: ItemFormModalProps) {
  const [formValues, setFormValues] = useState<ItemFormValues>(() =>
    item ? mapItemToForm(item) : EMPTY_FORM_VALUES,
  );
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isEdit = Boolean(item);

  const statuses = useMemo(() => TYPE_STATUS_PRESETS[formValues.type], [formValues.type]);

  if (!open) return null;

  const setField = <K extends keyof ItemFormValues>(field: K, value: ItemFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const onChangeType = (value: MediaType) => {
    const firstStatus = TYPE_STATUS_PRESETS[value][0];
    setFormValues((prev) => ({ ...prev, type: value, status: firstStatus }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchSuggestions(formValues.type, formValues.title);
      setSuggestions(results);
    } finally {
      setIsSearching(false);
    }
  };

  const applySuggestion = (suggestion: ItemSuggestion) => {
    setFormValues((prev) => ({
      ...prev,
      title: suggestion.title,
      creator: suggestion.creator ?? prev.creator,
      year: suggestion.year ? String(suggestion.year) : prev.year,
      imageUrl: suggestion.imageUrl ?? prev.imageUrl,
      author: prev.type === "book" ? suggestion.creator ?? prev.author : prev.author,
      director: prev.type === "movie" ? suggestion.creator ?? prev.director : prev.director,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized: LibraryItem = {
      id: item?.id ?? crypto.randomUUID(),
      createdAt: item?.createdAt ?? new Date().toISOString(),
      userId: item?.userId,
      type: formValues.type,
      title: formValues.title.trim(),
      creator: formValues.creator.trim() || undefined,
      year: formValues.year ? Number(formValues.year) : undefined,
      imageUrl: formValues.imageUrl.trim() || undefined,
      status: formValues.status,
      notes: formValues.notes.trim() || undefined,
      rating: formValues.rating ? Number(formValues.rating) : undefined,
      tags: formValues.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      movieInfo:
        formValues.type === "movie"
          ? {
              director: formValues.director.trim() || undefined,
              runtimeMinutes: formValues.runtimeMinutes ? Number(formValues.runtimeMinutes) : undefined,
            }
          : undefined,
      bookInfo:
        formValues.type === "book"
          ? {
              author: formValues.author.trim() || undefined,
              pageCount: formValues.pageCount ? Number(formValues.pageCount) : undefined,
            }
          : undefined,
    };

    await onSave(normalized);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{isEdit ? "Edit item" : "Add item"}</h2>
            <p className="text-sm text-zinc-400">Choose a type, search sources, and adjust details before saving.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-3 py-1 text-sm">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">Media type</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.type}
                onChange={(e) => onChangeType(e.target.value as MediaType)}
              >
                <option value="movie">Movie</option>
                <option value="book">Book</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-zinc-400">Title</span>
              <div className="flex gap-2">
                <input
                  required
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                  value={formValues.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Interstellar"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl border border-indigo-400/40 px-3 py-2 text-sm text-indigo-200"
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
            </label>
          </div>

          {suggestions.length > 0 && (
            <div className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-lg border border-white/10 bg-zinc-900/60 p-2 text-left text-sm hover:border-indigo-400/50"
                >
                  <p className="font-medium text-white">{suggestion.title}</p>
                  <p className="text-zinc-400">{suggestion.creator || "Unknown"}</p>
                  <p className="text-zinc-500">{suggestion.year || "—"}</p>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">Creator</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.creator}
                onChange={(e) => setField("creator", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">Year</span>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.year}
                onChange={(e) => setField("year", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">Status</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 capitalize"
                value={formValues.status}
                onChange={(e) => setField("status", e.target.value as ItemFormValues["status"])}
              >
                {statuses.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-zinc-400">Rating (1-5)</span>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.rating}
                onChange={(e) => setField("rating", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-zinc-400">Image URL</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.imageUrl}
                onChange={(e) => setField("imageUrl", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-zinc-400">Tags (comma separated)</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.tags}
                onChange={(e) => setField("tags", e.target.value)}
              />
            </label>

            {formValues.type === "movie" && (
              <>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Director</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                    value={formValues.director}
                    onChange={(e) => setField("director", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Runtime (minutes)</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                    value={formValues.runtimeMinutes}
                    onChange={(e) => setField("runtimeMinutes", e.target.value)}
                  />
                </label>
              </>
            )}

            {formValues.type === "book" && (
              <>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Author</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                    value={formValues.author}
                    onChange={(e) => setField("author", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-400">Page count</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                    value={formValues.pageCount}
                    onChange={(e) => setField("pageCount", e.target.value)}
                  />
                </label>
              </>
            )}

            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-zinc-400">Notes</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                value={formValues.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white">
              {isEdit ? "Save changes" : "Add to library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
