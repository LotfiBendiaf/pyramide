import { Suspense } from "react";
import Link from "next/link";
import { format, addDays, subDays, endOfWeek } from "date-fns";
import { CalendarClock, CalendarRange, Clock, AlertTriangle } from "lucide-react";
import { fetchVisits, fetchVisitStats } from "@/lib/actions/visit.action";
import { fetchAgents } from "@/lib/actions/users.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { VisitsList } from "@/components/visits/VisitsList";
import { VisitsFilter } from "@/components/visits/VisitsFilter";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import { PaginationControls } from "@/components/PaginationControls";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ROUTES from "@/constants/routes";
import { VisitFilters } from "@/types/visit";

const PER_PAGE = 20;

const STATUS_TABS = [
  { value: undefined, label: "Toutes" },
  { value: "SCHEDULED", label: "Planifiées" },
  { value: "COMPLETED", label: "Effectuées" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "NO_SHOW", label: "Absences" },
] as const;

type SearchParams = {
  status?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
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
    ...(searchParams.dateFrom ? { dateFrom: searchParams.dateFrom } : {}),
    ...(searchParams.dateTo ? { dateTo: searchParams.dateTo } : {}),
    ...(searchParams.search ? { search: searchParams.search } : {}),
    ...(isManager && searchParams.agentId && searchParams.agentId !== "__all__"
      ? { agentId: searchParams.agentId }
      : {}),
  };

  const visitsResult = await fetchVisits(filters);

  const visits = visitsResult.data?.visits ?? [];
  const total = visitsResult.data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} visite{total > 1 ? "s" : ""}
        </p>
      )}
      <VisitsList visits={visits} showAgent={isManager} />
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

function statHref(params: URLSearchParams, overrides: Record<string, string | undefined>) {
  const next = new URLSearchParams(params.toString());
  next.delete("page");
  Object.entries(overrides).forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });
  const query = next.toString();
  return query ? `${ROUTES.VISITS}?${query}` : ROUTES.VISITS;
}

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeStatus = params.status;
  const user = await getUserBySessionEmail();
  const canFilterByAgent = isElevatedRole(user.data?.role ?? "");

  const [agentsResult, statsResult] = await Promise.all([
    canFilterByAgent ? fetchAgents() : Promise.resolve({ success: true, data: [] }),
    fetchVisitStats(),
  ]);

  const stats = statsResult.data ?? { today: 0, week: 0, upcoming: 0, overdue: 0 };

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const yesterday = format(subDays(now, 1), "yyyy-MM-dd");

  const activeParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "status" && key !== "page") activeParams.set(key, value);
  });

  const statCards = [
    {
      key: "today",
      label: "Aujourd'hui",
      value: stats.today,
      icon: Clock,
      color: "text-blue-600 bg-blue-100",
      href: statHref(activeParams, { status: undefined, dateFrom: today, dateTo: today }),
    },
    {
      key: "week",
      label: "Cette semaine",
      value: stats.week,
      icon: CalendarRange,
      color: "text-purple-600 bg-purple-100",
      href: statHref(activeParams, { status: undefined, dateFrom: today, dateTo: weekEnd }),
    },
    {
      key: "upcoming",
      label: "À venir",
      value: stats.upcoming,
      icon: CalendarClock,
      color: "text-green-600 bg-green-100",
      href: statHref(activeParams, { status: "SCHEDULED", dateFrom: tomorrow, dateTo: undefined }),
    },
    {
      key: "overdue",
      label: "En retard",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
      href: statHref(activeParams, { status: "SCHEDULED", dateFrom: undefined, dateTo: yesterday }),
    },
  ];

  const getStatusHref = (status?: string) => {
    const tabParams = new URLSearchParams(activeParams.toString());
    if (status) tabParams.set("status", status);
    const query = tabParams.toString();
    return query ? `${ROUTES.VISITS}?${query}` : ROUTES.VISITS;
  };

  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Visites"
        subtitle="Planifiez et suivez les visites de biens"
        action={<ScheduleVisitDialog />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.key} href={stat.href}>
            <Card className="flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex gap-1 border-b flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value || (!activeStatus && !tab.value);
          return (
            <Link
              key={tab.label}
              href={getStatusHref(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <VisitsFilter agents={agentsResult.data ?? []} canFilterByAgent={canFilterByAgent} />

      <Suspense fallback={<ListingsSkeleton />}>
        <VisitsContent searchParams={params} />
      </Suspense>
    </section>
  );
}
