import { Suspense } from "react";
import {
  fetchNegotiations,
  fetchPendingNegotiationVerificationCount,
} from "@/lib/actions/negotiation.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import {
  NegotiationsList,
  Negotiation,
} from "@/components/negotiations/NegotiationsList";
import { NegotiationsFilter } from "@/components/negotiations/NegotiationsFilter";
import { PaginationControls } from "@/components/PaginationControls";
import { NegotiationFilters } from "@/types/negotiation";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchAgents } from "@/lib/actions/users.action";
import { isElevatedRole } from "@/constants/values";
import Link from "next/link";
import ROUTES from "@/constants/routes";

const PER_PAGE = 20;

const STATUS_TABS = [
  { value: undefined, label: "Toutes" },
  { value: "PENDING_VERIFICATION", label: "En vérification" },
  { value: "ACTIVE", label: "En cours" },
  { value: "CLOSING", label: "Closing" },
  { value: "DEAL_DONE", label: "Conclues" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "REJECTED", label: "Refusées" },
] as const;

type SearchParams = {
  status?: string;
  agentId?: string;
  listingId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

function getNumberParam(value?: string) {
  if (!value) return undefined;

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

async function NegotiationsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserBySessionEmail();
  const isManager = isElevatedRole(user.data?.role ?? "");

  const pageParam = Number(searchParams.page ?? 1);
  const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1;
  const filters: NegotiationFilters = {
    page,
    limit: PER_PAGE,
    ...(searchParams.status
      ? { status: searchParams.status as NegotiationFilters["status"] }
      : {}),
  };

  if (searchParams.agentId && searchParams.agentId !== "__all__") {
    filters.agentId = searchParams.agentId;
  }
  if (searchParams.listingId) {
    filters.listingId = searchParams.listingId;
  }
  if (searchParams.clientId) {
    filters.clientId = searchParams.clientId;
  }
  if (searchParams.dateFrom) {
    filters.dateFrom = searchParams.dateFrom;
  }
  if (searchParams.dateTo) {
    filters.dateTo = searchParams.dateTo;
  }

  const minPrice = getNumberParam(searchParams.minPrice);
  const maxPrice = getNumberParam(searchParams.maxPrice);

  if (minPrice !== undefined) {
    filters.minPrice = minPrice;
  }
  if (maxPrice !== undefined) {
    filters.maxPrice = maxPrice;
  }

  const result = await fetchNegotiations(filters);
  const negotiations = result.data?.negotiations ?? [];
  const total = result.data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      {isManager && total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} négociation{total > 1 ? "s" : ""}
        </p>
      )}
      <NegotiationsList
        negotiations={negotiations as unknown as Negotiation[]}
      />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeStatus = params.status;
  const user = await getUserBySessionEmail();
  const canFilterByAgent = isElevatedRole(user.data?.role ?? "");
  const agentsResult = canFilterByAgent
    ? await fetchAgents()
    : { success: true, data: [] };
  const pendingVerificationResult =
    await fetchPendingNegotiationVerificationCount();
  const pendingVerificationCount = pendingVerificationResult.data ?? 0;

  const getStatusHref = (status?: string) => {
    const tabParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === "status" || key === "page") return;
      tabParams.set(key, value);
    });

    if (status) {
      tabParams.set("status", status);
    }

    const query = tabParams.toString();
    return query ? `${ROUTES.NEGOTIATIONS}?${query}` : ROUTES.NEGOTIATIONS;
  };

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Négociations"
        subtitle="Suivez les négociations en cours et les affaires conclues"
      />

      {/* Status tabs */}
      <div className="flex gap-1 border-b flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive =
            activeStatus === tab.value || (!activeStatus && !tab.value);
          const href = getStatusHref(tab.value);
          const showPendingCount =
            tab.value === "PENDING_VERIFICATION" &&
            pendingVerificationCount > 0;

          return (
            <Link
              key={tab.label}
              href={href}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {showPendingCount && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700">
                  {pendingVerificationCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <NegotiationsFilter
        agents={agentsResult.data ?? []}
        canFilterByAgent={canFilterByAgent}
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <NegotiationsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
