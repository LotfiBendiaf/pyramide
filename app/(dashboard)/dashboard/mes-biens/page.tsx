import { Suspense } from "react";
import {
  fetchMyActiveListings,
  fetchMyApprovedListings,
} from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { MyActiveListings } from "@/components/listings/MyActiveListings";
import { MyApprovedListings } from "@/components/listings/MyApprovedListings";
import { PaginationControls } from "@/components/PaginationControls";

const ITEMS_PER_PAGE = 10;

function parsePage(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

async function MesBiensContent({
  approvedPage,
  activePage,
}: {
  approvedPage: number;
  activePage: number;
}) {
  const [approvedResult, activeResult] = await Promise.all([
    fetchMyApprovedListings({ page: approvedPage, limit: ITEMS_PER_PAGE }),
    fetchMyActiveListings({ page: activePage, limit: ITEMS_PER_PAGE }),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Annonces approuvées</h2>
          <p className="text-sm text-muted-foreground">
            Les biens qui vous sont affectés et dont la visite photo reste à
            organiser.
          </p>
        </div>
        <MyApprovedListings listings={approvedResult.data ?? []} />
        <PaginationControls
          currentPage={approvedPage}
          totalPages={Math.ceil((approvedResult.total ?? 0) / ITEMS_PER_PAGE)}
          pageParam="approvedPage"
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Biens actifs avec les visites planifiées
          </h2>
          <p className="text-sm text-muted-foreground">
            Vos biens actifs et les prochains rendez-vous associés.
          </p>
        </div>
        <MyActiveListings listings={activeResult.data ?? []} />
        <PaginationControls
          currentPage={activePage}
          totalPages={Math.ceil((activeResult.total ?? 0) / ITEMS_PER_PAGE)}
          pageParam="activePage"
        />
      </section>
    </div>
  );
}

export default async function MesBiensPage({
  searchParams,
}: {
  searchParams?: Promise<{ approvedPage?: string; activePage?: string }>;
}) {
  const params = await searchParams;
  const approvedPage = parsePage(params?.approvedPage);
  const activePage = parsePage(params?.activePage);

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Mes Biens"
        subtitle="Vos annonces affectées et leur suivi"
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <MesBiensContent approvedPage={approvedPage} activePage={activePage} />
      </Suspense>
    </section>
  );
}
