import { Suspense } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchClients, fetchClientPipelineCounts } from "@/lib/actions/client.action";
import { fetchTeamMembers } from "@/lib/actions/users.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import ClientsTable from "@/components/ClientsTable";
import ClientsFilter from "@/components/ClientsFilter";
import { PaginationControls } from "@/components/PaginationControls";
import { PipelineBar } from "@/components/pipeline/PipelineBar";
import { ClientFilters } from "@/types/client";
import ROUTES from "@/constants/routes";

const CLIENTS_PER_PAGE = 10;

type SearchParams = {
  agentId?: string;
  qualification?: string;
  type?: string;
  propertyType?: string;
  search?: string;
  page?: string;
  view?: string;
  stage?: string;
};

async function ClientsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" || currentUser.data?.role === "MANAGER";
  const canUsePipeline = currentUser.data?.role === "AGENT";

  const isArchiveView = searchParams.view === "archives";
  const page = searchParams.page ? Math.max(1, Number(searchParams.page)) : 1;

  const filterParams: ClientFilters = {
    page,
    limit: CLIENTS_PER_PAGE,
    archived: isArchiveView ? true : undefined,
  };

  if (!isArchiveView) {
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
    if (searchParams.propertyType && searchParams.propertyType !== "__all__") {
      filterParams.wantedPropertyType = searchParams.propertyType;
    }
    if (searchParams.search) {
      filterParams.search = searchParams.search;
    }
    if (canUsePipeline && searchParams.stage) {
      filterParams.pipelineStage =
        searchParams.stage as ClientFilters["pipelineStage"];
    }
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
        {isArchiveView ? "Aucun client archivé." : "Aucun client trouvé."}
      </div>
    );
  }

  const totalPages = Math.ceil((result.data?.total ?? 0) / CLIENTS_PER_PAGE);

  return (
    <>
      <ClientsTable
        clients={clients}
        agents={isAdmin ? agentsResult.data || [] : []}
        userRole={currentUser.data?.role}
      />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
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
  const canUsePipeline = currentUser.data?.role === "AGENT";
  const isArchiveView = params?.view === "archives";

  const [agentsResult, countsResult] = await Promise.all([
    isAdmin ? fetchTeamMembers() : Promise.resolve({ success: true, data: [] }),
    canUsePipeline && !isArchiveView
      ? fetchClientPipelineCounts()
      : Promise.resolve({ success: true, data: [] }),
  ]);

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Clients"
        subtitle="Gérez et qualifiez vos clients"
      />

      {isAdmin && (
        <div className="flex gap-2 border-b">
          <Link
            href={ROUTES.CLIENTS_DASHBOARD}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              !isArchiveView
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Clients actifs
          </Link>
          <Link
            href={`${ROUTES.CLIENTS_DASHBOARD}?view=archives`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isArchiveView
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Archives
          </Link>
        </div>
      )}

      {canUsePipeline && !isArchiveView && (
        <PipelineBar counts={countsResult.data ?? []} />
      )}

      {!isArchiveView && (
        <ClientsFilter
          agents={isAdmin ? agentsResult.data || [] : []}
          canFilterByAgent={isAdmin}
        />
      )}

      <Suspense fallback={<ListingsSkeleton />}>
        <ClientsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
