import { FollowUpForm } from "@/components/forms/followUp-form";
import { SectionHeader } from "@/components/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { fetchClients } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchAgents } from "@/lib/actions/users.action";

export default async function NewFollowUpPage() {
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";

  const [listings, clients, agentsRes] = await Promise.all([
    fetchListings(),
    fetchClients(),
    isAdmin ? fetchAgents() : Promise.resolve({ success: true, data: [] }),
  ]);

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
            clients={clients.data?.clients || []}
            userRole={currentUser.data?.role}
            agents={isAdmin ? agentsRes.data || [] : []}
          />
        </CardContent>
      </Card>
    </section>
  );
}
