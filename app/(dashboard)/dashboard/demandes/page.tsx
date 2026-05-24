import { redirect } from "next/navigation";
import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import {
  ArchiveRequestItem,
  ArchiveRequestsList,
} from "@/components/negotiations/ArchiveRequestsList";
import {
  NegotiationRequest,
  NegotiationRequestsList,
} from "@/components/negotiations/NegotiationRequestsList";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchPendingNegotiationRequests } from "@/lib/actions/negotiation.action";
import { fetchPendingArchiveRequests } from "@/lib/actions/archiveRequest.action";
import ROUTES from "@/constants/routes";

type DemandTab = "all" | "negotiations" | "archive";
type SearchParams = { tab?: string };

const tabs: { value: DemandTab; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "negotiations", label: "Négociations" },
  { value: "archive", label: "Archive" },
];

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.value === params.tab)
    ? (params.tab as DemandTab)
    : "all";
  const user = await getUserBySessionEmail();
  const role = user.data?.role ?? "";

  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect(ROUTES.DASHBOARD);
  }

  const [negotiationResult, archiveResult] = await Promise.all([
    fetchPendingNegotiationRequests(),
    fetchPendingArchiveRequests(),
  ]);
  const negotiationRequests = negotiationResult.data?.negotiations ?? [];
  const archiveRequests = archiveResult.data?.requests ?? [];
  const negotiationTotal = negotiationResult.data?.total ?? 0;
  const archiveTotal = archiveResult.data?.total ?? 0;
  const total = negotiationTotal + archiveTotal;

  return (
    <section className="container space-y-6 py-6">
      <SectionHeader
        title="Demandes"
        subtitle="Validez ou refusez les nouvelles négociations avant leur activation"
      />

      <p className="text-sm text-muted-foreground">
        {total} demande{total > 1 ? "s" : ""} en attente
      </p>

      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const count =
            tab.value === "negotiations"
              ? negotiationTotal
              : tab.value === "archive"
                ? archiveTotal
                : total;
          const href =
            tab.value === "all"
              ? ROUTES.DEMANDES
              : `${ROUTES.DEMANDES}?tab=${tab.value}`;

          return (
            <Link
              key={tab.value}
              href={href}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({count})
            </Link>
          );
        })}
      </div>

      {(activeTab === "all" || activeTab === "negotiations") && (
        <div className="space-y-3">
          {activeTab === "all" && (
            <h3 className="text-sm font-semibold">Negotiation Requests</h3>
          )}
          <NegotiationRequestsList
            requests={negotiationRequests as unknown as NegotiationRequest[]}
          />
        </div>
      )}

      {(activeTab === "all" || activeTab === "archive") && (
        <div className="space-y-3">
          {activeTab === "all" && (
            <h3 className="text-sm font-semibold">Client Archive Requests</h3>
          )}
          <ArchiveRequestsList
            requests={archiveRequests as unknown as ArchiveRequestItem[]}
          />
        </div>
      )}
    </section>
  );
}
