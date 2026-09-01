import { ItemDetailStarter } from "@/components/library/item-detail-starter";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  return <ItemDetailStarter id={id} />;
}
