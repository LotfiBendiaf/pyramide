import React, { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { fetchListings } from "@/lib/actions/listings.action";
import ListingCard from "../ListingCard";
import { ListingsSkeleton } from "../skeletons/ListingsSkeleton";

const ListingsContent = async () => {
  const result = await fetchListings({});

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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
};

export default function ListingsSection() {
  return (
    <section className="container py-10 px-3">
      <SectionHeader
        title="Biens à vendre à Oran"
        subtitle="Trouvez notre selection de biens immobiliers"
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsContent />
      </Suspense>
    </section>
  );
}
