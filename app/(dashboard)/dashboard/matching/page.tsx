import { fetchClients } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import MatchingView from "@/components/matching/MatchingView";
import { SectionHeader } from "@/components/SectionHeader";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchListingAssignees } from "@/lib/actions/users.action";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

export default async function MatchingPage({ searchParams }: { searchParams: Promise<{ agentId?: string }> }) {
  const [{ agentId }, user] = await Promise.all([searchParams, getUserBySessionEmail()]);
  const isAdmin = ["ADMIN", "MANAGER", "DEVELOPER"].includes(user.data?.role ?? "");
  const selectedAgentId = isAdmin ? agentId : user.data?._id?.toString();
  const agentsResult = isAdmin ? await fetchListingAssignees() : undefined;
  const [clientsResult, listingsResult] = await Promise.all([
    selectedAgentId ? fetchClients({ limit: 100, agentId: selectedAgentId }) : Promise.resolve({ success: true, data: { clients: [], total: 0 } }),
    selectedAgentId ? fetchListings({ limit: 100, agentId: selectedAgentId, assignedToCurrentUser: !isAdmin }) : Promise.resolve({ success: true, data: [] }),
  ]);

  const allClients = clientsResult.success
    ? (clientsResult.data?.clients ?? [])
    : [];
  const allListings = listingsResult.success ? (listingsResult.data ?? []) : [];

  // Only buyers and renters have meaningful matching
  const matchableClients = allClients.filter(
    (c) => c.type === "BUYER" || c.type === "RENTER"
  );

  // Only active listings can be matched
  const activeListings = allListings.filter(
    (l) => l.status === "En Vente" || l.status === "En Location"
  );

  return (
    <section className="container py-6">
      <div className="mb-6">
        <SectionHeader
          title="Matching"
          subtitle="Correspondances calculées uniquement dans le portefeuille d’un même agent."
        />
      </div>
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-4">
          {(agentsResult?.data ?? []).map((agent) => (
            <Button key={agent._id} asChild variant={selectedAgentId === agent._id ? "default" : "outline"} size="sm">
              <Link href={`${ROUTES.MATCHING}?agentId=${agent._id}`}>
                {`${agent.firstname ?? ""} ${agent.lastname ?? ""}`.trim() || agent.name}
              </Link>
            </Button>
          ))}
        </div>
      )}
      {!selectedAgentId ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Sélectionnez un agent pour consulter le matching de son portefeuille.
        </div>
      ) : (
        <MatchingView clients={matchableClients} listings={activeListings} />
      )}
    </section>
  );
}
