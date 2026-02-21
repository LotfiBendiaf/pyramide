import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";
import ClientMatchingPanel from "@/components/clients/ClientMatchingPanel";

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

  const client = clientResult.data;

  return (
    <>
      <ClientDetailPage
        client={client}
        followUps={followUpsResult.data ?? []}
      />
      {(client.type === "BUYER" || client.type === "RENTER") && (
        <div className="container pb-10">
          <ClientMatchingPanel client={client} />
        </div>
      )}
    </>
  );
}
