import { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { fetchListings } from "@/lib/actions/listings.action";
import ListingCard from "../ListingCard";
import { ListingsSkeleton } from "../skeletons/ListingsSkeleton";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ListingsContent = async () => {
  const result = await fetchListings({
    isPremium: true,
  });

  if (!result.success) {
    return (
      <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
        Impossible de charger les annonces.
      </div>
    );
  }

  const listings = result.data;

  if (!listings?.length) {
    return (
      <div className="rounded-xl border border-dashed border-primary/15 bg-third/20 px-6 py-16 text-center">
        <p className="font-medium text-foreground">
          Notre prochaine sélection arrive bientôt.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Découvrez entre-temps l&apos;ensemble de nos biens disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
};

export default function PremiumListings() {
  return (
    <section
      id="premium-listings"
      className="relative border-t border-primary/[0.08] px-3 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-third/45 blur-3xl"
        aria-hidden="true"
      />

      <SectionHeader
        title="Biens d'exception"
        subtitle="Une sélection confidentielle de propriétés choisies pour leur emplacement, leur qualité et leur caractère."
        watermark="PREMIUM"
        buttonHref={ROUTES.LISTINGS}
        buttonLabel="Explorer tous les biens"
        className="mb-12 md:mb-16"
      />

      <div className="relative">
        <Suspense fallback={<ListingsSkeleton />}>
          <ListingsContent />
        </Suspense>
      </div>

      <Link
        href={ROUTES.LISTINGS}
        className="mt-8 flex items-center justify-center gap-2 border-t border-primary/10 pt-5 text-sm font-semibold text-primary md:hidden"
      >
        Explorer tous les biens
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
