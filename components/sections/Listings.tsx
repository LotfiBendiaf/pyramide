import { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { fetchListings } from "@/lib/actions/listings.action";
import { ListingsSkeleton } from "../skeletons/ListingsSkeleton";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { FeaturedListingsFeed, type FeaturedListingFilters } from "./FeaturedListingsFeed";

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    propertyType?: string;
    limit?: string;
  };
};

const ListingsContent = async ({ searchParams }: ListingsSectionProps) => {
  const params = await searchParams;
  const filters: FeaturedListingFilters = {
    city: params?.city,
    status:
      params?.status && params.status !== "Retiré"
        ? (params.status as "En Vente" | "En Location")
        : undefined,
    minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
    bedrooms: params?.bedrooms ? Number(params.bedrooms) : undefined,
    propertyType: params?.propertyType,
  };
  const result = await fetchListings({
    ...filters,
    isFeatured: true,
    isPublished: true,
    isValidated: true,
    limit: 4,
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

  return <FeaturedListingsFeed initialListings={listings} total={result.total ?? listings.length} filters={filters} />;
};

export default function ListingsSection({
  searchParams,
}: ListingsSectionProps) {
  return (
    <section id="listings" className="relative container py-10 px-3 pt-20">
      {/* Client component */}
      <SectionHeader
        title="Biens immobiliers"
        subtitle="Découvrez les biens sélectionnés par notre équipe"
        buttonHref={ROUTES.LISTINGS}
        buttonLabel="Voir tous les biens"
      />

      <Suspense fallback={<ListingsSkeleton />}>
        {/* <SearchFilter /> */}
        <ListingsContent searchParams={searchParams} />
      </Suspense>

      <div className="flex justify-center mt-10">
        <Link href={ROUTES.LISTINGS}>
          <Button variant="outline">
            Voir tous les biens
            <ArrowUpRight className="ml-2" size={18} />
          </Button>
        </Link>
      </div>
    </section>
  );
}
