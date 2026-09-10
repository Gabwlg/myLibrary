"use client";

import { useEffect, useMemo, useState } from "react";

import { LibraryPageFrame, LibraryPageNotice } from "@/components/library/library-page-frame";
import { selectFinishedPerMonth, useDemoLibrary } from "@/lib/library/demo-store";
import {
  barHeightPercent,
  chartMax,
  finishedPerMonth,
  formatMonthLabel,
  type MonthlyFinishCount,
} from "@/lib/library/finished-per-month";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { fetchFinishedPerMonthSource } from "@/lib/supabase/library-repository";

type RealLoad =
  | { phase: "loading" }
  | { phase: "signed-out" }
  | { phase: "ready"; data: MonthlyFinishCount[] };

/**
 * The `/stats` page body: a bar chart of how many Items reached their type's
 * Terminal status per calendar month. Real mode reads the joined
 * `progress_events` query; Demo mode aggregates the same derived in-memory log
 * the dashboard mutates, via the shared store — mirroring `ItemHistoryView`.
 */
export function StatsView() {
  const demoMode = !hasSupabaseConfig();
  const demoLibrary = useDemoLibrary();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [real, setReal] = useState<RealLoad>({ phase: "loading" });

  const demoData = useMemo(() => selectFinishedPerMonth(demoLibrary), [demoLibrary]);

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
      const { events, items } = await fetchFinishedPerMonthSource(supabase, data.user.id);
      if (!active) return;
      setReal({ phase: "ready", data: finishedPerMonth(events, items) });
    })();

    return () => {
      active = false;
    };
  }, [demoMode, supabase]);

  if (demoMode) return <StatsShell data={demoData} />;
  if (real.phase === "loading") return <LibraryPageNotice>Loading stats…</LibraryPageNotice>;
  if (real.phase === "signed-out") {
    return <LibraryPageNotice>Sign in on the dashboard to view your stats.</LibraryPageNotice>;
  }
  return <StatsShell data={real.data} />;
}

function StatsShell({ data }: { data: MonthlyFinishCount[] }) {
  return (
    <LibraryPageFrame>
      <h1 className="text-2xl font-semibold text-white">Finished per month</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Items that reached their type&rsquo;s terminal status, by calendar month (UTC).
      </p>

      {data.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No finished items yet.</p>
      ) : (
        <FinishedPerMonthChart data={data} />
      )}
    </LibraryPageFrame>
  );
}

/**
 * A hand-rolled CSS bar chart — no charting dependency (the ticket keeps this
 * self-contained). Each month is a flex column whose filled height is
 * proportional to the busiest month (`barHeightPercent`); a zero month keeps its
 * column and label but draws only a faint baseline in a muted colour, so it
 * reads as an empty axis slot rather than a real bar.
 */
function FinishedPerMonthChart({ data }: { data: MonthlyFinishCount[] }) {
  const max = chartMax(data);

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-w-max items-end gap-3" style={{ height: 200 }}>
        {data.map((entry) => (
          <div key={entry.month} className="flex h-full w-12 flex-col items-center justify-end gap-2">
            <span className="text-xs tabular-nums text-zinc-300">{entry.count}</span>
            <div
              className={`w-full rounded-t ${entry.count === 0 ? "bg-white/10" : "bg-indigo-500"}`}
              style={{ height: `${barHeightPercent(entry.count, max)}%`, minHeight: 2 }}
              aria-hidden
            />
          </div>
        ))}
      </div>
      <div className="flex min-w-max gap-3">
        {data.map((entry) => (
          <div key={entry.month} className="w-12 text-center text-[11px] leading-tight text-zinc-400">
            {formatMonthLabel(entry.month)}
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {data.map((entry) => (
          <li key={entry.month}>
            {formatMonthLabel(entry.month)}: {entry.count} finished
          </li>
        ))}
      </ul>
    </div>
  );
}
