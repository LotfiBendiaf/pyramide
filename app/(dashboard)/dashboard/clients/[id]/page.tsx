import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";

export default async function ClientDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const [clientResult, followUpsResult] = await Promise.all([
    fetchClientById(id),
    fetchFollowUpsByClient(id),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  return (
    <ClientDetailPage
      client={clientResult.data}
      followUps={followUpsResult.data ?? []}
    />
  );
}
