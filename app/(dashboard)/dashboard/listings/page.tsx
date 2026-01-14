import { Suspense } from "react";
import { fetchListings } from "@/lib/actions/listings.action";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import { SectionHeader } from "@/components/SectionHeader";
import ListingCard from "@/components/listing/ListingCard";

async function ListingsContent() {
  const result = await fetchListings();

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
        Aucune annonce trouvée.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <section className="container py-16">
      <SectionHeader title="Biens à vendre à Oran" />

      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsContent />
      </Suspense>
    </section>
  );
}
