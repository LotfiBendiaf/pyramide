import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { fetchAgents } from "@/lib/actions/users.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";

export default async function ClientDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";

  const [clientResult, followUpsResult, agentsResult] = await Promise.all([
    fetchClientById(id),
    fetchFollowUpsByClient(id),
    isAdmin ? fetchAgents() : Promise.resolve({ success: true, data: [] }),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  return (
    <ClientDetailPage
      client={clientResult.data}
      followUps={followUpsResult.data ?? []}
      userRole={currentUser.data?.role}
      agents={isAdmin ? agentsResult.data || [] : []}
    />
  );
}
