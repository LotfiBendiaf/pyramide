import { Suspense } from "react";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { hasPermission } from "@/lib/roleCheck";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { DailyReportView } from "@/components/dailyReport/DailyReportView";
import { getDailyReport } from "@/lib/actions/dailyReport.action";

async function getDailyReportData() {
  const user = await getUserBySessionEmail();
  const isAuthorized = hasPermission(user.data?.role || "", "view_dashboard");

  if (!isAuthorized) {
    throw new Error("Accès non autorisé");
  }

  const role = user.data?.role || "";
  const userId = user.data?._id || "";
  const userName = user.data?.firstname || "";

  // Fetch today's report directly via server action
  const data = await getDailyReport({ agentId: userId });

  return { ...data, role, userName, userId };
}

function DailyReportSkeleton() {
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

async function DailyReportContent() {
  const response = await getDailyReportData();

  if (!response.success || !response.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Erreur de chargement
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Impossible de charger le rapport quotidien
          </p>
        </div>
      </div>
    );
  }

  const userName = response.userName;

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        title="Rapport Quotidien"
        subtitle={`Bonjour ${userName} — votre activité d'aujourd'hui`}
      />

      {/* Daily Report View */}
      <DailyReportView report={response.data} />
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <main>
      <Suspense fallback={<DailyReportSkeleton />}>
        <DailyReportContent />
      </Suspense>
    </main>
  );
}
