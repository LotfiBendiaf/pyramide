import { Suspense } from "react";
import { fetchListings } from "@/lib/actions/listings.action";
import { SectionHeader } from "@/components/SectionHeader";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { ListingFollowUpTable } from "@/components/listing/ListingFollowUpTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { Plus } from "lucide-react";

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

  return <ListingFollowUpTable listings={listings} />;
}

export default function ListingsPage() {
  return (
    <section className="space-y-10">
      <SectionHeader title="Listing avec Suivies" />
      <Link href={ROUTES.NEW_FOLLOWUP} className="inline-block">
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un suivie
        </Button>
      </Link>

      <Suspense fallback={<TableSkeleton />}>
        <ListingsContent />
      </Suspense>
    </section>
  );
}
