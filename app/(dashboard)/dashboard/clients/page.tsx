import { Suspense } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchClients } from "@/lib/actions/client.action";
import { fetchTeamMembers } from "@/lib/actions/users.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import ClientsTable from "@/components/ClientsTable";
import ClientsFilter from "@/components/ClientsFilter";
import { ClientFilters } from "@/types/client";

type SearchParams = {
  agentId?: string;
  qualification?: string;
  type?: string;
  search?: string;
};

async function ClientsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";

  // Build filter params, excluding "__all__" values
  const filterParams: ClientFilters = {};

  if (searchParams.agentId && searchParams.agentId !== "__all__") {
    filterParams.agentId = searchParams.agentId;
  }
  if (searchParams.qualification && searchParams.qualification !== "__all__") {
    filterParams.qualificationStatus =
      searchParams.qualification as ClientFilters["qualificationStatus"];
  }
  if (searchParams.type && searchParams.type !== "__all__") {
    filterParams.type = searchParams.type as ClientFilters["type"];
  }
  if (searchParams.search) {
    filterParams.search = searchParams.search;
  }

  const [result, agentsResult] = await Promise.all([
    fetchClients(filterParams),
    isAdmin ? fetchTeamMembers() : Promise.resolve({ success: true, data: [] }),
  ]);

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les clients.
      </div>
    );
  }

  const clients = result.data?.clients;

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Aucun client trouvé.
      </div>
    );
  }

  return (
    <ClientsTable
      clients={clients}
      agents={isAdmin ? agentsResult.data || [] : []}
      userRole={currentUser.data?.role}
    />
  );
}

export default async function ClientPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";

  const agentsResult = isAdmin
    ? await fetchTeamMembers()
    : { success: true, data: [] };

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Clients"
        subtitle="Gérez et qualifiez vos clients"
      />

      <ClientsFilter
        agents={isAdmin ? agentsResult.data || [] : []}
        canFilterByAgent={isAdmin}
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <ClientsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
