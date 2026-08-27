import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchListings } from "@/lib/actions/listings.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingTable } from "@/components/listing/ListingTable";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import ListingFilterDashboard from "@/components/ListingFilterDashboard";
import { PaginationControls } from "@/components/PaginationControls";
import ROUTES from "@/constants/routes";
import { fetchListingAssignees } from "@/lib/actions/users.action";

const LISTINGS_PER_PAGE = 15;

function canAccessNewListings(role?: string) {
  return role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";
}

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    rentMinPrice?: string;
    rentMaxPrice?: string;
    saleMinPrice?: string;
    saleMaxPrice?: string;
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
    agentId?: string;
  };
};

type ListingsContentProps = ListingsSectionProps & {
  assignees?: User[];
  canAssignAgent?: boolean;
  assignedToCurrentUser?: boolean;
};

async function ListingsContent({
  searchParams,
  assignees = [],
  canAssignAgent = false,
  assignedToCurrentUser = false,
}: ListingsContentProps) {
  const params = await searchParams;
  const page = params?.page ? Math.max(1, Number(params.page)) : 1;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = params?.view === "neutre";
  const isApprovedView = params?.view === "approved";
  const isActiveView = !isArchiveView && !isNeutreView && !isApprovedView;

  const sortBy = params?.sortBy ?? (isActiveView ? "referenceCode" : undefined);
  const sortOrder =
    (params?.sortOrder as "asc" | "desc" | undefined) ??
    (isActiveView ? "desc" : undefined);

  const result = await fetchListings({
    assignedToCurrentUser: isApprovedView && assignedToCurrentUser,
    agentId: params?.agentId,
    search: params?.search,
    city: params?.city,
    status: params?.status as ListingInput["status"] | undefined,
    minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
    rentMinPrice: params?.rentMinPrice
      ? Number(params.rentMinPrice)
      : undefined,
    rentMaxPrice: params?.rentMaxPrice
      ? Number(params.rentMaxPrice)
      : undefined,
    saleMinPrice: params?.saleMinPrice
      ? Number(params.saleMinPrice)
      : undefined,
    saleMaxPrice: params?.saleMaxPrice
      ? Number(params.saleMaxPrice)
      : undefined,
    minScore: params?.minScore ? Number(params.minScore) : undefined,
    bedrooms: params?.bedrooms ? Number(params.bedrooms) : undefined,
    propertyType: params?.propertyType,
    isPremium: params?.isPremium,
    isValidated:
      isActiveView || isApprovedView ? true : isNeutreView ? false : undefined,
    validationStatus: isActiveView
      ? "VALIDATED"
      : isApprovedView
        ? "APPROVED"
        : isNeutreView
          ? "NEUTRAL"
          : undefined,
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
          : isApprovedView
            ? "Aucune annonce approuvée."
          : isNeutreView
            ? "Aucune nouvelle annonce en attente."
            : "Aucune annonce trouvée."}
      </div>
    );
  }

  const totalPages = Math.ceil((result.total ?? 0) / LISTINGS_PER_PAGE);

  return (
    <>
      <ListingTable
        listings={listings}
        agents={assignees}
        canAssignAgent={canAssignAgent}
      />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default async function ListingsPage({
  searchParams,
}: ListingsSectionProps) {
  const params = await searchParams;
  const user = await getUserBySessionEmail();
  const canViewNewListings = canAccessNewListings(user.data?.role);
  const canAssignAgent = user.data?.role === "ADMIN" || user.data?.role === "DEVELOPER";
  const assigneesResult = canAssignAgent
    ? await fetchListingAssignees()
    : undefined;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = canViewNewListings && params?.view === "neutre";
  const isApprovedView = params?.view === "approved";
  const isActiveView = !isArchiveView && !isNeutreView && !isApprovedView;

  if (params?.view === "neutre" && !canViewNewListings) {
    redirect(ROUTES.LISTINGS_DASHBOARD);
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <section className="space-y-10">
      <SectionHeader
        title="Biens à vendre ou à louer"
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
          href={`${ROUTES.LISTINGS_DASHBOARD}?view=approved`}
          className={tabClass(isApprovedView)}
        >
          Annonces approuvées
        </Link>
        {canViewNewListings && (
          <Link
            href={`${ROUTES.LISTINGS_DASHBOARD}?view=neutre`}
            className={tabClass(isNeutreView)}
          >
            Nouvelles annonces
          </Link>
        )}
        <Link
          href={`${ROUTES.LISTINGS_DASHBOARD}?view=archives`}
          className={tabClass(isArchiveView)}
        >
          Annonces archivées
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ListingFilterDashboard
          agents={assigneesResult?.data ?? []}
          key={
            isArchiveView
              ? "archives"
              : isApprovedView
                ? "approved"
                : isNeutreView
                  ? "neutre"
                  : "active"
          }
        />
        <ListingsContent
          searchParams={searchParams}
          assignees={assigneesResult?.data ?? []}
          canAssignAgent={canAssignAgent}
          assignedToCurrentUser={user.data?.role === "AGENT"}
        />
      </Suspense>
    </section>
  );
}
