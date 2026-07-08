import { Suspense } from "react";
import {
  fetchMyActiveListings,
  fetchMyApprovedListings,
} from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { MyActiveListings } from "@/components/listings/MyActiveListings";
import { MyApprovedListings } from "@/components/listings/MyApprovedListings";

async function MesBiensContent() {
  const [approvedResult, activeResult] = await Promise.all([
    fetchMyApprovedListings(),
    fetchMyActiveListings(),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Annonces approuvées</h2>
          <p className="text-sm text-muted-foreground">
            Les biens qui vous sont affectés et dont la visite photo reste à
            organiser.
          </p>
        </div>
        <MyApprovedListings listings={approvedResult.data ?? []} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Biens actifs avec les visites planifiées
          </h2>
          <p className="text-sm text-muted-foreground">
            Vos biens actifs et les prochains rendez-vous associés.
          </p>
        </div>
        <MyActiveListings listings={activeResult.data ?? []} />
      </section>
    </div>
  );
}

export default function MesBiensPage() {
  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Mes Biens"
        subtitle="Vos annonces affectées et leur suivi"
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <MesBiensContent />
      </Suspense>
    </section>
  );
}
