import { FollowUpForm } from "@/components/forms/followUp-form";
import { SectionHeader } from "@/components/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { fetchClients, fetchClientById } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchAgents } from "@/lib/actions/users.action";

export default async function NewFollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";

  const [listings, clients, agentsRes, preselectedClient] = await Promise.all([
    fetchListings(),
    fetchClients({ limit: 100 }),
    isAdmin ? fetchAgents() : Promise.resolve({ success: true, data: [] }),
    clientId ? fetchClientById(clientId) : Promise.resolve(null),
  ]);

  // Ensure the preselected client is always in the list (it may be outside the first 100)
  const clientsList = clients.data?.clients || [];
  if (preselectedClient?.data && !clientsList.some((c) => c._id === clientId)) {
    clientsList.unshift(preselectedClient.data);
  }

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Nouveau suivi"
        subtitle="Créez un suivi pour un client"
      />

      <Card>
        <CardContent className="pt-6">
          <FollowUpForm
            listings={listings.data || []}
            clients={clientsList}
            userRole={currentUser.data?.role}
            agents={isAdmin ? agentsRes.data || [] : []}
            defaultClientId={clientId}
          />
        </CardContent>
      </Card>
    </section>
  );
}
