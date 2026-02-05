import { Suspense } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { Plus } from "lucide-react";
import { fetchAllFollowUps } from "@/lib/actions/followUp.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { FollowUpFeed } from "@/components/followUp/FollowUpFeed";

async function FollowUpsContent() {
  const [result, currentUser] = await Promise.all([
    fetchAllFollowUps(),
    getUserBySessionEmail(),
  ]);

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les suivis.
      </div>
    );
  }

  const followUps = result.data;

  if (!followUps || followUps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Aucun suivi trouvé.
      </div>
    );
  }

  return <FollowUpFeed followUps={followUps} userRole={currentUser.data?.role} />;
}

export default function FollowUpsPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Suivis" subtitle="Gérez vos suivis clients" />
        <Link href={ROUTES.NEW_FOLLOWUP}>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nouveau suivi
          </Button>
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <FollowUpsContent />
      </Suspense>
    </section>
  );
}
