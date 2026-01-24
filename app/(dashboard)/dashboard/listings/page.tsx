import { Suspense } from "react";
import { fetchListings } from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { ListingTable } from "@/components/listing/ListingTable";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

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

  return <ListingTable listings={listings} />;
}

export default function ListingsPage() {
  return (
    <section>
      <SectionHeader title="Biens à vendre à Oran" />

      <Suspense fallback={<TableSkeleton />}>
        <ListingsContent />
      </Suspense>
    </section>
  );
}
