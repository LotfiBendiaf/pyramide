import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { fetchListingsBySellerClient } from "@/lib/actions/listings.action";
import { fetchClientDealDone } from "@/lib/actions/negotiation.action";
import { fetchVisitsByClient } from "@/lib/actions/visit.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";
import ClientMatchingPanel from "@/components/clients/ClientMatchingPanel";
import { ClientPipelineSection } from "@/components/clients/ClientPipelineSection";
import { ListingTable } from "@/components/listing/ListingTable";
import { VisitsList } from "@/components/visits/VisitsList";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import { SectionHeader } from "@/components/SectionHeader";

export default async function ClientDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [clientResult, followUpsResult, visitsResult, dealDoneResult, user] =
    await Promise.all([
      fetchClientById(id),
      fetchFollowUpsByClient(id),
      fetchVisitsByClient(id, 1, 50),
      fetchClientDealDone(id),
      getUserBySessionEmail(),
    ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;
  const isManager = isElevatedRole(user.data?.role ?? "");
  const canUsePipeline = user.data?.role === "AGENT";
  const visits = visitsResult.data?.visits ?? [];

  const sellerListingsResult =
    client.type === "SELLER" ? await fetchListingsBySellerClient(id) : null;

  return (
    <>
      {/* Pipeline section — agents only, buyers/renters/investors only */}
      {canUsePipeline && client.type !== "SELLER" && (
        <div className="container pb-6">
          <ClientPipelineSection
            clientId={client._id}
            pipelineStage={client.pipelineStage}
            clientTemperature={client.clientTemperature}
          />
        </div>
      )}

      <ClientDetailPage
        client={client}
        followUps={followUpsResult.data ?? []}
        dealDone={dealDoneResult.success ? dealDoneResult.data : null}
      />

      {/* Visit history */}
      <div className="container pb-6 space-y-3">
        <SectionHeader
          title="Visites"
          subtitle={
            visits.length > 0
              ? `${visits.length} visite${visits.length > 1 ? "s" : ""} enregistrée${visits.length > 1 ? "s" : ""}`
              : "Aucune visite enregistrée"
          }
          action={<ScheduleVisitDialog prefilledClientId={client._id} />}
        />
        <VisitsList visits={visits} showAgent={isManager} showClient={false} />
      </div>

      {(client.type === "BUYER" || client.type === "RENTER") && (
        <div className="container pb-10">
          <ClientMatchingPanel client={client} />
        </div>
      )}
      {client.type === "SELLER" && sellerListingsResult?.success && (
        <div className="container pb-10">
          <ListingTable listings={sellerListingsResult.data ?? []} />
        </div>
      )}
    </>
  );
}
