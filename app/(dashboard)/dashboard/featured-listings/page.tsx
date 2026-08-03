import { redirect } from "next/navigation";
import { fetchListings } from "@/lib/actions/listings.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { FeaturedListingManager } from "@/components/listing/FeaturedListingManager";
import { PaginationControls } from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/SectionHeader";
import ROUTES from "@/constants/routes";

const PAGE_SIZE = 20;

export default async function FeaturedListingsPage({ searchParams }: RouteParams) {
  const user = await getUserBySessionEmail();
  if (!user.data || !["ADMIN", "MANAGER"].includes(user.data.role)) {
    redirect(ROUTES.DASHBOARD);
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim();
  const result = await fetchListings({
    search,
    isPublished: true,
    isValidated: true,
    validationStatus: "VALIDATED",
    page,
    limit: PAGE_SIZE,
    sortBy: "isFeatured",
    sortOrder: "desc",
  });
  const listings = result.data ?? [];
  const totalPages = Math.ceil((result.total ?? 0) / PAGE_SIZE);

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Biens à la une"
        subtitle="Choisissez les annonces qui apparaissent sur la page d’accueil. Le nombre de sélections n’est pas limité."
        buttonLabel="Ajouter un bien"
        buttonHref={ROUTES.LISTING_ADD}
      />

      <form className="flex max-w-xl gap-2">
        <Input name="search" defaultValue={search} placeholder="Référence, titre, ville ou propriétaire…" />
        <Button type="submit" variant="outline">Rechercher</Button>
      </form>

      {!result.success ? (
        <p className="py-16 text-center text-destructive">Impossible de charger les annonces.</p>
      ) : listings.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Aucune annonce publiée et validée trouvée.</p>
      ) : (
        <FeaturedListingManager listings={listings} />
      )}
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </section>
  );
}
