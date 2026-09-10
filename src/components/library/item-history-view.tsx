"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { selectItemHistory, useDemoLibrary } from "@/lib/library/demo-store";
import { formatEventTime, transitionLabel } from "@/lib/library/progress-format";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { fetchLibraryItem, fetchProgressEvents } from "@/lib/supabase/library-repository";
import type { LibraryItem, ProgressEvent } from "@/types/library";

interface ItemHistoryViewProps {
  itemId: string;
}

type RealLoad =
  | { phase: "loading" }
  | { phase: "signed-out" }
  | { phase: "ready"; item: LibraryItem | null; events: ProgressEvent[] };

/**
 * The per-Item history page body: the Item's title and a chronological timeline
 * of its Progress events, oldest first. Read-only — there is no editing here.
 * Real mode fetches from Supabase; Demo mode reads the same derived log the
 * dashboard mutates, via the shared store.
 */
export function ItemHistoryView({ itemId }: ItemHistoryViewProps) {
  const demoMode = !hasSupabaseConfig();
  const demoLibrary = useDemoLibrary();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [real, setReal] = useState<RealLoad>({ phase: "loading" });

  useEffect(() => {
    if (demoMode || !supabase) return;
    let active = true;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setReal({ phase: "signed-out" });
        return;
      }
      const [item, events] = await Promise.all([
        fetchLibraryItem(supabase, itemId),
        fetchProgressEvents(supabase, itemId),
      ]);
      if (!active) return;
      setReal({ phase: "ready", item, events });
    })();

    return () => {
      active = false;
    };
  }, [demoMode, supabase, itemId]);

  if (demoMode) {
    const { item, events } = selectItemHistory(demoLibrary, itemId);
    return <HistoryShell item={item} events={events} />;
  }

  if (real.phase === "loading") return <Notice>Loading history…</Notice>;
  if (real.phase === "signed-out") {
    return <Notice>Sign in on the dashboard to view this item&rsquo;s history.</Notice>;
  }
  return <HistoryShell item={real.item} events={real.events} />;
}

function HistoryShell({ item, events }: { item: LibraryItem | null; events: ProgressEvent[] }) {
  if (!item) return <Notice>That item could not be found.</Notice>;

  return (
    <Frame>
      <h1 className="text-2xl font-semibold text-white">{item.title}</h1>
      <p className="mt-1 text-sm text-zinc-400">Progress history</p>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No progress events recorded yet.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="text-sm text-zinc-100">{transitionLabel(event)}</span>
              <time dateTime={event.occurredAt} className="text-xs text-zinc-400">
                {formatEventTime(event.occurredAt)} UTC
              </time>
            </li>
          ))}
        </ol>
      )}
    </Frame>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Frame>
      <p className="text-sm text-zinc-300">{children}</p>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-zinc-100">
      <section className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">
          &larr; Back to dashboard
        </Link>
        <div className="mt-4">{children}</div>
      </section>
    </main>
  );
}
