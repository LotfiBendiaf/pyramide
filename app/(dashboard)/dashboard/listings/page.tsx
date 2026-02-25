import { Suspense } from "react";
import { fetchListings } from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingTable } from "@/components/listing/ListingTable";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import ListingFilterDashboard from "@/components/ListingFilterDashboard";
import ROUTES from "@/constants/routes";

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    minScore?: number;
    propertyType?: string;
    isPremium?: boolean;
    validated?: string;
  };
};

async function ListingsContent({ searchParams }: ListingsSectionProps) {
  const params = await searchParams;

  const result = await fetchListings({
    city: params?.city,
    status: params?.status as "En Vente" | "En Location" | undefined,
    minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
    minScore: params?.minScore ? Number(params.minScore) : undefined,
    bedrooms: params?.bedrooms ? Number(params.bedrooms) : undefined,
    propertyType: params?.propertyType,
    isPremium: params?.isPremium,
    isValidated: params?.validated === "true" ? true : undefined,
  });

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

  return <ListingTable listings={listings} />;
}

export default function ListingsPage({ searchParams }: ListingsSectionProps) {
  return (
    <section className="space-y-10">
      <SectionHeader
        title="Biens à vendre à Oran"
        buttonLabel="Ajouter un bien"
        buttonHref={ROUTES.LISTING_ADD}
      />

      <Suspense fallback={<TableSkeleton />}>
        <ListingFilterDashboard />
        <ListingsContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
