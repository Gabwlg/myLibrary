import Link from "next/link";

interface ItemDetailStarterProps {
  id: string;
}

export function ItemDetailStarter({ id }: ItemDetailStarterProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 text-zinc-100">
      <section className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Item detail starter</h1>
        <p className="mt-2 text-sm text-zinc-300">Item id: {id}</p>
        <p className="mt-3 text-sm text-zinc-400">
          The dashboard currently uses a detail modal. This route is a dedicated page starter for future deep-linkable
          item detail pages.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
