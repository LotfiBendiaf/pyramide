import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { fetchListingsBySellerClient } from "@/lib/actions/listings.action";
import { fetchVisitsByClient } from "@/lib/actions/visit.action";
import { fetchAgents } from "@/lib/actions/users.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";
import ClientMatchingPanel from "@/components/clients/ClientMatchingPanel";
import { ClientPipelineSection } from "@/components/clients/ClientPipelineSection";
import { ListingTable } from "@/components/listing/ListingTable";
import { VisitsList, Visit } from "@/components/visits/VisitsList";
import { SectionHeader } from "@/components/SectionHeader";

export default async function ClientDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [clientResult, followUpsResult, visitsResult, agentsResult, user] =
    await Promise.all([
      fetchClientById(id),
      fetchFollowUpsByClient(id),
      fetchVisitsByClient(id, 1, 50),
      fetchAgents(),
      getUserBySessionEmail(),
    ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;
  const isManager = isElevatedRole(user.data?.role ?? "");
  const currentUserId = user.data?._id?.toString() ?? "";

  const agents = (agentsResult.data ?? []).map((a) => ({
    _id: String(a._id),
    firstname: a.firstname,
    lastname: a.lastname,
  }));

  const visits = (visitsResult.data?.visits ?? []) as unknown as Visit[];

  const sellerListingsResult =
    client.type === "SELLER" ? await fetchListingsBySellerClient(id) : null;

  return (
    <>
      {/* Pipeline section — shown for buyers, renters, investors */}
      {client.type !== "SELLER" && (
        <div className="container pb-6">
          <ClientPipelineSection
            clientId={client._id}
            pipelineStage={client.pipelineStage}
            clientTemperature={client.clientTemperature}
            phase2AgentId={client.phase2Agent}
            isManager={isManager}
            currentUserId={currentUserId}
            agents={agents}
          />
        </div>
      )}
      <ClientDetailPage
        client={client}
        followUps={followUpsResult.data ?? []}
      />

      {/* Visit history */}
      {visits.length > 0 && (
        <div className="container pb-6 space-y-3">
          <SectionHeader
            title="Visites"
            subtitle={`${visits.length} visite${visits.length > 1 ? "s" : ""} enregistrée${visits.length > 1 ? "s" : ""}`}
          />
          <VisitsList visits={visits} showAgent={isManager} />
        </div>
      )}

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
