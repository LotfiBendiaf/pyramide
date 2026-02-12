export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { Plus } from "lucide-react";
import { fetchAllFollowUps } from "@/lib/actions/followUp.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchAgents } from "@/lib/actions/users.action";
import { FollowUpFeed } from "@/components/followUp/FollowUpFeed";
import FollowUpsFilter from "@/components/FollowUpsFilter";
import { FollowUpFilters } from "@/types/followUp";

type SearchParams = {
  agentId?: string;
  type?: string;
  status?: string;
  channel?: string;
  search?: string;
};

async function FollowUpsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getUserBySessionEmail();

  // Build filter params, excluding "__all__" values
  const filterParams: FollowUpFilters = {};

  if (searchParams.agentId && searchParams.agentId !== "__all__") {
    filterParams.agentId = searchParams.agentId;
  }
  if (searchParams.type && searchParams.type !== "__all__") {
    filterParams.type = searchParams.type as FollowUpFilters["type"];
  }
  if (searchParams.status && searchParams.status !== "__all__") {
    filterParams.status = searchParams.status as FollowUpFilters["status"];
  }
  if (searchParams.channel && searchParams.channel !== "__all__") {
    filterParams.channel = searchParams.channel as FollowUpFilters["channel"];
  }
  if (searchParams.search) {
    filterParams.search = searchParams.search;
  }

  const result = await fetchAllFollowUps(filterParams);

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les suivis.
      </div>
    );
  }

  const followUps = result.data;

  if (!followUps || followUps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Aucun suivi trouvé.
      </div>
    );
  }

  return (
    <FollowUpFeed followUps={followUps} userRole={currentUser.data?.role} />
  );
}

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentUser = await getUserBySessionEmail();
  const isAdmin =
    currentUser.data?.role === "ADMIN" ||
    currentUser.data?.role === "MANAGER" ||
    currentUser.data?.role === "DEVELOPER";

  const agentsResult = isAdmin
    ? await fetchAgents()
    : { success: true, data: [] };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Suivis" subtitle="Gérez vos suivis clients" />
        <Link href={ROUTES.NEW_FOLLOWUP}>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nouveau suivi
          </Button>
        </Link>
      </div>

      <FollowUpsFilter
        agents={isAdmin ? agentsResult.data || [] : []}
        canFilterByAgent={isAdmin}
      />

      <Suspense fallback={<TableSkeleton />}>
        <FollowUpsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
