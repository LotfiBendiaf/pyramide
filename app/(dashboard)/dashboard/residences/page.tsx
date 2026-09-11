import { redirect } from "next/navigation";
import { fetchResidences } from "@/lib/actions/residence.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { SectionHeader } from "@/components/SectionHeader";
import { ResidenceTable } from "@/components/residence/ResidenceTable";
import { PaginationControls } from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { hasFullAccess } from "@/constants/values";

const RESIDENCES_PER_PAGE = 15;

export default async function ResidencesDashboardPage({
  searchParams,
}: RouteParams) {
  const user = await getUserBySessionEmail();
  if (!user.data || !hasFullAccess(user.data.role)) {
    redirect(ROUTES.DASHBOARD);
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim();

  const result = await fetchResidences({
    search,
    page,
    limit: RESIDENCES_PER_PAGE,
  });

  const residences = result.data ?? [];
  const totalPages = Math.ceil((result.total ?? 0) / RESIDENCES_PER_PAGE);

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Résidences"
        subtitle="Gérez vos programmes immobiliers neufs et l'état de leurs unités."
        buttonLabel="Ajouter une résidence"
        buttonHref={ROUTES.RESIDENCE_ADD}
      />

      <form className="flex max-w-xl gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Référence, titre ou ville…"
        />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {!result.success ? (
        <p className="py-16 text-center text-destructive">
          Impossible de charger les résidences.
        </p>
      ) : residences.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Aucune résidence trouvée.
        </p>
      ) : (
        <ResidenceTable residences={residences} />
      )}
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </section>
  );
}
