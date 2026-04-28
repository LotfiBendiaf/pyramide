import { Suspense } from "react";
import { fetchVisits } from "@/lib/actions/visit.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { VisitsList, Visit } from "@/components/visits/VisitsList";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import { PaginationControls } from "@/components/PaginationControls";
import { VisitFilters } from "@/types/visit";

const PER_PAGE = 20;

type SearchParams = {
  status?: string;
  page?: string;
};

async function VisitsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUserBySessionEmail();
  const isManager = isElevatedRole(user.data?.role ?? "");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const filters: VisitFilters = {
    page,
    limit: PER_PAGE,
    ...(searchParams.status ? { status: searchParams.status as VisitFilters["status"] } : {}),
  };

  const visitsResult = await fetchVisits(filters);

  const visits = visitsResult.data?.visits ?? [];
  const total = visitsResult.data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <div className="flex justify-end mb-4">
        <ScheduleVisitDialog />
      </div>
      <VisitsList visits={visits as unknown as Visit[]} showAgent={isManager} />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Visites"
        subtitle="Planifiez et suivez les visites de biens"
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <VisitsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
