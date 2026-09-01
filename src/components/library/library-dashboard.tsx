"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MEDIA_TYPE_LABELS, STATUS_OPTIONS } from "@/lib/library/constants";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/library/filter-sort";
import { SAMPLE_ITEMS } from "@/lib/library/sample-items";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import {
  createLibraryItem,
  deleteLibraryItem,
  fetchLibraryItems,
  updateLibraryItem,
} from "@/lib/supabase/library-repository";
import type { LibraryItem, SortOption } from "@/types/library";

import { ItemCard } from "./item-card";
import { ItemDetailModal } from "./item-detail-modal";
import { ItemFormModal } from "./item-form-modal";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
];

export function LibraryDashboard() {
  const [items, setItems] = useState<LibraryItem[]>(() => (hasSupabaseConfig() ? [] : SAMPLE_ITEMS));
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const demoMode = !hasSupabaseConfig();

  const filteredItems = useMemo(() => applyFilters(items, filters), [items, filters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (demoMode || !supabase) return;

    const initialize = async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUserId(id);

      if (id) {
        const loaded = await fetchLibraryItems(supabase, id);
        setItems(loaded);
      }
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId(id);
      if (!id) {
        setItems([]);
        return;
      }
      void fetchLibraryItems(supabase, id).then(setItems);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [demoMode, supabase]);

  const openCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const saveItem = async (item: LibraryItem) => {
    const isExisting = items.some((existing) => existing.id === item.id);

    if (demoMode || !supabase || !userId) {
      setItems((prev) => {
        if (isExisting) {
          return prev.map((existing) => (existing.id === item.id ? item : existing));
        }
        return [item, ...prev];
      });
      setIsFormOpen(false);
      setEditingItem(null);
      return;
    }

    if (isExisting) {
      const updated = await updateLibraryItem(supabase, item);
      setItems((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
    } else {
      const created = await createLibraryItem(supabase, item, userId);
      setItems((prev) => [created, ...prev]);
    }

    setIsFormOpen(false);
    setEditingItem(null);
  };

  const removeItem = async (id: string) => {
    if (!demoMode && supabase && userId) {
      await deleteLibraryItem(supabase, id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem(null);
  };

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }

    setEmail("");
    setPassword("");
  };

  const signUp = async () => {
    if (!supabase) return;
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const needsAuth = !demoMode && !userId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-400">myLibrary</p>
            <h1 className="text-3xl font-semibold text-white">Your cinematic reading shelf</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDark((value) => !value)}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm"
            >
              {isDark ? "Light" : "Dark"} mode
            </button>
            {!needsAuth && !demoMode && (
              <button onClick={signOut} className="rounded-xl border border-white/20 px-3 py-2 text-sm">
                Sign out
              </button>
            )}
          </div>
        </header>

        {demoMode && (
          <div className="mb-6 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            Demo mode is active. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to use live auth and database storage.
          </div>
        )}

        {needsAuth ? (
          <section className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Sign in to your library</h2>
            <p className="mt-1 text-sm text-zinc-400">Use your Supabase credentials to load personal items.</p>
            <form onSubmit={signIn} className="mt-4 space-y-3">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
              />
              {authError && <p className="text-sm text-rose-300">{authError}</p>}
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white">
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={signUp}
                  className="rounded-xl border border-indigo-400/40 px-4 py-2 text-sm text-indigo-200"
                >
                  Sign up
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Search title</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  placeholder="Search..."
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Type</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value as typeof prev.type }))
                  }
                >
                  <option value="all">All types</option>
                  {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Status</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value as typeof prev.status }))
                  }
                >
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-zinc-400">Sort</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sort: e.target.value as typeof prev.sort }))
                  }
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-2">
                <button
                  onClick={openCreate}
                  className="h-[42px] rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
                >
                  Add item
                </button>
                <Link
                  href="/add"
                  className="h-[42px] rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-200"
                >
                  Add page
                </Link>
              </div>
            </section>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-zinc-900/50 p-10 text-center">
                <p className="text-lg text-zinc-200">No items yet.</p>
                <p className="text-sm text-zinc-400">Start your collection by adding your first movie or book.</p>
              </div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      <ItemFormModal
        key={`${editingItem?.id ?? "new"}-${isFormOpen ? "open" : "closed"}`}
        open={isFormOpen}
        item={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
      />
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={(item) => {
          setSelectedItem(null);
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onDelete={removeItem}
      />
    </div>
  );
}
