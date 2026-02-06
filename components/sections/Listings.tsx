import { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { fetchListings } from "@/lib/actions/listings.action";
import ListingCard from "../ListingCard";
import { ListingsSkeleton } from "../skeletons/ListingsSkeleton";
import ROUTES from "@/constants/routes";
import SearchFilter from "../SearchFilter";

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    propertyType?: string;
  };
};

const ListingsContent = async ({ searchParams }: ListingsSectionProps) => {
  const params = await searchParams;
  const result = await fetchListings({
    city: params?.city,
    status:
      params?.status && params.status !== "Retiré"
        ? (params.status as "En Vente" | "En Location")
        : undefined,
    minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
    bedrooms: params?.bedrooms ? Number(params.bedrooms) : undefined,
    propertyType: params?.propertyType,
    isPremium: false,
  });

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
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

export default function ListingsSection({
  searchParams,
}: ListingsSectionProps) {
  return (
    <section className="relative container py-10 px-3 pt-20">
      {/* Client component */}
      <SectionHeader
        title="Biens immobiliers"
        subtitle="Trouvez notre sélection de biens"
        buttonHref={ROUTES.LISTINGS}
        buttonLabel="Voir tous les biens"
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <SearchFilter />
        <ListingsContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
