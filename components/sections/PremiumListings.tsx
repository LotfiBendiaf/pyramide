import { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { fetchListings } from "@/lib/actions/listings.action";
import ListingCard from "../ListingCard";
import { ListingsSkeleton } from "../skeletons/ListingsSkeleton";
import ROUTES from "@/constants/routes";

const ListingsContent = async () => {
  const result = await fetchListings({
    isPremium: true,
  });

  if (!result.success) {
    return (
      <div className="text-center text-red-500">
        Impossible de charger les annonces.
      </div>
    );
  }

  const listings = result.data;

  if (!listings?.length) {
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

export default function PremiumListings() {
  return (
    <section className="relative container px-3">
      {/* Client component */}
      <SectionHeader
        title="Biens Exclusifs"
        subtitle="Trouvez notre sélection de biens d'exception"
        buttonHref={ROUTES.LISTINGS}
        buttonLabel="Voir tous les biens"
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsContent />
      </Suspense>
    </section>
  );
}
