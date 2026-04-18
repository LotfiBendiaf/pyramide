import { Suspense } from "react";
import Link from "next/link";
import { fetchListings } from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingTable } from "@/components/listing/ListingTable";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import ListingFilterDashboard from "@/components/ListingFilterDashboard";
import { PaginationControls } from "@/components/PaginationControls";
import ROUTES from "@/constants/routes";

const LISTINGS_PER_PAGE = 15;

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    minScore?: number;
    propertyType?: string;
    isPremium?: boolean;
    validated?: string;
    page?: string;
    search?: string;
    view?: string;
    sortBy?: string;
    sortOrder?: string;
  };
};

async function ListingsContent({ searchParams }: ListingsSectionProps) {
  const params = await searchParams;
  const page = params?.page ? Math.max(1, Number(params.page)) : 1;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = params?.view === "neutre";
  const isActiveView = !isArchiveView && !isNeutreView;

  // Annonces validées: always filter isValidated=true and default sort by referenceCode asc
  const sortBy = params?.sortBy ?? (isActiveView ? "referenceCode" : undefined);
  const sortOrder = (params?.sortOrder as "asc" | "desc" | undefined) ?? (isActiveView ? "desc" : undefined);

  const result = await fetchListings({
    search: params?.search,
    city: params?.city,
    status: params?.status as "En Vente" | "En Location" | undefined,
    minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
    minScore: params?.minScore ? Number(params.minScore) : undefined,
    bedrooms: params?.bedrooms ? Number(params.bedrooms) : undefined,
    propertyType: params?.propertyType,
    isPremium: params?.isPremium,
    isValidated: isActiveView ? true : isNeutreView ? false : undefined,
    archived: isArchiveView ? true : undefined,
    page,
    limit: LISTINGS_PER_PAGE,
    sortBy,
    sortOrder,
  });

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les annonces.
      </div>
    );
  }

  const listings = result.data;

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        {isArchiveView
          ? "Aucune annonce archivée."
          : isNeutreView
          ? "Aucune nouvelle annonce en attente."
          : "Aucune annonce trouvée."}
      </div>
    );
  }

  const totalPages = Math.ceil((result.total ?? 0) / LISTINGS_PER_PAGE);

  return (
    <>
      <ListingTable listings={listings} />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default async function ListingsPage({
  searchParams,
}: ListingsSectionProps) {
  const params = await searchParams;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = params?.view === "neutre";
  const isActiveView = !isArchiveView && !isNeutreView;

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <section className="space-y-10">
      <SectionHeader
        title="Biens à vendre à Oran"
        buttonLabel="Ajouter un bien"
        buttonHref={ROUTES.LISTING_ADD}
      />

      <div className="flex gap-2 border-b">
        <Link
          href={ROUTES.LISTINGS_DASHBOARD}
          className={tabClass(isActiveView)}
        >
          Annonces validées
        </Link>
        <Link
          href={`${ROUTES.LISTINGS_DASHBOARD}?view=neutre`}
          className={tabClass(isNeutreView)}
        >
          Nouvelles annonces
        </Link>
        <Link
          href={`${ROUTES.LISTINGS_DASHBOARD}?view=archives`}
          className={tabClass(isArchiveView)}
        >
          Archives
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        {isActiveView && <ListingFilterDashboard />}
        <ListingsContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
