import { Suspense } from "react";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { TeamReportView } from "@/components/dailyReport/TeamReportView";
import { redirect } from "next/navigation";
import ROUTES from "@/constants/routes";
import { getTeamReport } from "@/lib/actions/teamReport.action";

async function getTeamReportData() {
  const user = await getUserBySessionEmail();
  const role = user.data?.role || "";
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";

  if (!isAdmin) {
    redirect(ROUTES.DASHBOARD);
  }

  // Fetch today's team report directly via server action
  const data = await getTeamReport();

  return { ...data, role };
}

function TeamReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

async function TeamReportContent() {
  const response = await getTeamReportData();

  if (!response.success || !response.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Erreur de chargement
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Impossible de charger le rapport d&apos;équipe
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        title="Rapport d'Équipe"
        subtitle="Vue d'ensemble de l'activité quotidienne de votre équipe"
      />

      {/* Team Report View */}
      <TeamReportView data={response.data} />
    </div>
  );
}

export default function TeamReportPage() {
  return (
    <main>
      <Suspense fallback={<TeamReportSkeleton />}>
        <TeamReportContent />
      </Suspense>
    </main>
  );
}
