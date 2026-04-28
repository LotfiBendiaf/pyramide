import { Suspense } from "react";
import { fetchNegotiations } from "@/lib/actions/negotiation.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import {
  NegotiationsList,
  Negotiation,
} from "@/components/negotiations/NegotiationsList";
import { PaginationControls } from "@/components/PaginationControls";
import { NegotiationFilters } from "@/types/negotiation";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import Link from "next/link";
import ROUTES from "@/constants/routes";

const PER_PAGE = 20;

const STATUS_TABS = [
  { value: undefined, label: "Toutes" },
  { value: "ACTIVE", label: "En cours" },
  { value: "CLOSING", label: "Closing" },
  { value: "DEAL_DONE", label: "Conclues" },
  { value: "CANCELLED", label: "Annulées" },
] as const;

type SearchParams = { status?: string; page?: string };

async function NegotiationsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserBySessionEmail();
  const isManager = isElevatedRole(user.data?.role ?? "");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const filters: NegotiationFilters = {
    page,
    limit: PER_PAGE,
    ...(searchParams.status
      ? { status: searchParams.status as NegotiationFilters["status"] }
      : {}),
  };

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
          const href = tab.value
            ? `${ROUTES.NEGOTIATIONS}?status=${tab.value}`
            : ROUTES.NEGOTIATIONS;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Suspense fallback={<ListingsSkeleton />}>
        <NegotiationsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
