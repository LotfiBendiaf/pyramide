import { Suspense } from "react";
import { fetchListings } from "@/lib/actions/listings.action";
import ListingCard from "@/components/ListingCard";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import SearchFilter from "@/components/SearchFilter";
import Navbar from "@/components/navigation/Navbar";
import { SectionHeader } from "@/components/SectionHeader";

type SearchParams = {
  city?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  propertyType?: string;
};

type ListingsPageProps = {
  searchParams: Promise<SearchParams>;
};

async function ListingsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const result = await fetchListings({
    city: searchParams?.city,
    status: searchParams?.status as "En Vente" | "En Location",
    minPrice: searchParams?.minPrice
      ? Number(searchParams.minPrice)
      : undefined,
    maxPrice: searchParams?.maxPrice
      ? Number(searchParams.maxPrice)
      : undefined,
    bedrooms: searchParams?.bedrooms
      ? Number(searchParams.bedrooms)
      : undefined,
    propertyType: searchParams?.propertyType,
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
        Aucune annonce trouvée pour ces critères.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  );
}

export default async function ListingsPage({
  searchParams,
}: ListingsPageProps) {
  const params = await searchParams;
  const statusLabel =
    params.status === "En Vente"
      ? "à vendre"
      : params.status === "En Location"
        ? "à louer"
        : "";

  return (
    <main className="min-h-screen">
      <div className="bg-black">
        <Navbar variant="solid" />
      </div>
      <section className="relative container mx-auto py-10 px-3">
        <div className="mb-8 text-center">
          <SectionHeader
            title={
              statusLabel
                ? `Biens immobiliers ${statusLabel}`
                : "Tous nos biens immobiliers"
            }
            subtitle="Découvrez notre sélection de propriétés"
          />
        </div>

        <Suspense fallback={<ListingsSkeleton />}>
          <div className="mt-8">
            <SearchFilter variant="inline" className="mb-8" />
            <ListingsContent searchParams={params} />
          </div>
        </Suspense>
      </section>
    </main>
  );
}
