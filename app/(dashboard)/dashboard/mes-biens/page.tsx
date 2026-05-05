import { Suspense } from "react";
import { fetchMyActiveListings } from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { MyActiveListings } from "@/components/listings/MyActiveListings";

async function MesBiensContent() {
  const result = await fetchMyActiveListings();
  const listings = result.data ?? [];

  return <MyActiveListings listings={listings} />;
}

export default function MesBiensPage() {
  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Mes Biens"
        subtitle="Vos biens actifs avec les visites planifiées"
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <MesBiensContent />
      </Suspense>
    </section>
  );
}
