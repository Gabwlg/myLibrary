import Image from "next/image";

import type { LibraryItem } from "@/types/library";

interface ItemDetailModalProps {
  item: LibraryItem | null;
  onClose: () => void;
  onEdit: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
}

export function ItemDetailModal({ item, onClose, onEdit, onDelete }: ItemDetailModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-200 sm:grid-cols-[220px_1fr]">
        <div className="relative h-72 overflow-hidden rounded-xl bg-zinc-800">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="220px" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">No image</div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
              <p className="text-sm text-zinc-400">{item.creator || "Unknown creator"}</p>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/15 px-3 py-1 text-sm">
              Close
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Type</dt>
              <dd className="capitalize">{item.type}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="capitalize">{item.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Year</dt>
              <dd>{item.year || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Rating</dt>
              <dd>{item.rating ? `${item.rating}/5` : "—"}</dd>
            </div>
          </dl>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {item.notes && (
            <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">{item.notes}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onEdit(item)}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
            >
              Edit item
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="rounded-xl border border-rose-500/50 px-4 py-2 text-sm text-rose-300"
            >
              Delete item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
