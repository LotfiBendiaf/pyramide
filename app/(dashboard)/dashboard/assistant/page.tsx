import { canUseAssistant } from "@/lib/assistant-access";
import { redirect } from "next/navigation";
import { AssistantHistoryPage } from "@/components/dashboard/AssistantWorkspace";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { z } from "zod";

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const { data: user } = await getUserBySessionEmail();
  if (!canUseAssistant(user?.role)) redirect("/dashboard");
  const params = await searchParams;
  const requestedConversation = z.string().uuid().safeParse(params.conversation);
  return <AssistantHistoryPage initialConversationId={requestedConversation.success ? requestedConversation.data : undefined} />;
}
