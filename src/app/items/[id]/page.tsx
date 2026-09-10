import { ItemHistoryView } from "@/components/library/item-history-view";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  return <ItemHistoryView itemId={id} />;
}
