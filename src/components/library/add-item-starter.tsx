import Link from "next/link";

export function AddItemStarter() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 text-zinc-100">
      <section className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Add item flow starter</h1>
        <p className="mt-2 text-sm text-zinc-300">
          The full add/edit modal is available on the dashboard. This route exists as a dedicated page starter for future
          server actions and deeper multi-step add flow.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-400">
          <li>Step 1: choose media type</li>
          <li>Step 2: search TMDB/Open Library suggestions</li>
          <li>Step 3: review auto-filled metadata and manually adjust before save</li>
        </ul>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open dashboard add modal
        </Link>
      </section>
    </main>
  );
}
