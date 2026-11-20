import { FollowUpsEditor } from "@/components/bot-manager/follow-ups-editor";

interface FollowUpsPageProps {
  params: Promise<{ productId: string }>;
}

export default async function FollowUpsPage({ params }: FollowUpsPageProps) {
  const { productId: questionId } = await params;

  return <FollowUpsEditor questionId={questionId} />;
}
