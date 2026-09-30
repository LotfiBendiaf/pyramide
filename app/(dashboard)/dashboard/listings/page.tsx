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
import { canManageListingPublication } from "@/constants/values";

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
  canPublish?: boolean;
  canRequestPublication?: boolean;
  currentUserId?: string;
};

async function ListingsContent({
  searchParams,
  assignees = [],
  canAssignAgent = false,
  assignedToCurrentUser = false,
  canPublish = false,
  canRequestPublication = false,
  currentUserId,
}: ListingsContentProps) {
  const params = await searchParams;
  const page = params?.page ? Math.max(1, Number(params.page)) : 1;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = params?.view === "neutre";
  const isApprovedView = params?.view === "approved";
  const isPublishingView = params?.view === "publishing";
  const isActiveView = !isArchiveView && !isNeutreView && !isApprovedView && !isPublishingView;

  const sortBy = params?.sortBy ?? (isActiveView ? "referenceCode" : undefined);
  const sortOrder =
    (params?.sortOrder as "asc" | "desc" | undefined) ??
    (isActiveView ? "desc" : undefined);

  const result = await fetchListings({
    publicationRequested: isPublishingView ? true : undefined,
    isPublished: isPublishingView ? false : undefined,
    assignedToCurrentUser:
      (isApprovedView || isPublishingView) && assignedToCurrentUser,
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
        {isPublishingView
            ? "Aucune annonce en attente de publication."
          : isArchiveView
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
        canPublish={canPublish}
        canRequestPublication={canRequestPublication}
        currentUserId={currentUserId}
        publicationReviewMode={isPublishingView}
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
  const canPublish = canManageListingPublication(user.data?.role);
  const canRequestPublication = user.data?.role === "AGENT";
  const canFilterByAgent = canAssignAgent || user.data?.role === "AGENT";
  const assigneesResult = canFilterByAgent
    ? await fetchListingAssignees()
    : undefined;
  const isArchiveView = params?.view === "archives";
  const isNeutreView = canViewNewListings && params?.view === "neutre";
  const isApprovedView = params?.view === "approved";
  const canViewPublishingQueue = canPublish || canRequestPublication;
  const isPublishingView = canViewPublishingQueue && params?.view === "publishing";
  const isActiveView = !isArchiveView && !isNeutreView && !isApprovedView && !isPublishingView;

  if (params?.view === "neutre" && !canViewNewListings) {
    redirect(ROUTES.LISTINGS_DASHBOARD);
  }
  if (params?.view === "publishing" && !canViewPublishingQueue) {
    redirect(ROUTES.LISTINGS_DASHBOARD);
  }
  if (params?.view === "social") {
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

      <div className="flex flex-wrap gap-2 border-b">
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
        {canViewPublishingQueue && (
          <Link
            href={`${ROUTES.LISTINGS_DASHBOARD}?view=publishing`}
            className={tabClass(isPublishingView)}
          >
            Annonces à publier
          </Link>
        )}
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
          agents={
            isApprovedView && user.data?.role === "AGENT"
              ? []
              : assigneesResult?.data ?? []
          }
          key={
            isPublishingView
                ? "publishing"
              : isArchiveView
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
          canPublish={canPublish}
          canRequestPublication={canRequestPublication}
          currentUserId={user.data?._id?.toString()}
        />
      </Suspense>
    </section>
  );
}
