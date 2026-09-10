import Link from "next/link";

/**
 * The shared chrome for the standalone read-only views — the per-Item history
 * at `/items/[id]` and the stats chart at `/stats`: a centered card with a
 * back-to-dashboard link. Extracted so the two views can't drift apart.
 */
export function LibraryPageFrame({ children }: { children: React.ReactNode }) {
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

/** A single line of muted text inside a `LibraryPageFrame` — loading, empty, and
 * signed-out states. */
export function LibraryPageNotice({ children }: { children: React.ReactNode }) {
  return (
    <LibraryPageFrame>
      <p className="text-sm text-zinc-300">{children}</p>
    </LibraryPageFrame>
  );
}
