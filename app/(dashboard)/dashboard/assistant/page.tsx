import { canUseAssistant } from "@/lib/assistant-access";
import { redirect } from "next/navigation";
import { AssistantHistoryPage } from "@/components/dashboard/AssistantWorkspace";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";

export default async function AssistantPage() {
  const { data: user } = await getUserBySessionEmail();
  if (!canUseAssistant(user?.role)) redirect("/dashboard");
  return <AssistantHistoryPage />;
}
