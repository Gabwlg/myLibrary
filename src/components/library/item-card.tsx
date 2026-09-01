import Image from "next/image";

import { MEDIA_TYPE_LABELS } from "@/lib/library/constants";
import type { LibraryItem } from "@/types/library";

interface ItemCardProps {
  item: LibraryItem;
  onClick: (item: LibraryItem) => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-indigo-400/40"
    >
      <div className="relative h-48 w-full bg-zinc-800">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">No image</div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-white">{item.title}</h3>
          <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">
            {MEDIA_TYPE_LABELS[item.type]}
          </span>
        </div>
        <p className="line-clamp-1 text-sm text-zinc-400">{item.creator || "Unknown creator"}</p>
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span>{item.year || "—"}</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 capitalize">{item.status}</span>
        </div>
      </div>
    </button>
  );
}
