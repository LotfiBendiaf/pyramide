import { FollowUpForm } from "@/components/forms/followUp-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClients } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import { fetchAgents } from "@/lib/actions/users.action";

export default async function NewFollowUpPage() {
  const [listings, clients, agents] = await Promise.all([
    fetchListings(),
    fetchClients(),
    fetchAgents(),
  ]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nouveau suivi client</CardTitle>
      </CardHeader>

      <CardContent>
        <FollowUpForm
          listings={listings.data || []}
          clients={clients.data?.clients || []}
          agents={agents.data || []}
        />
      </CardContent>
    </Card>
  );
}
