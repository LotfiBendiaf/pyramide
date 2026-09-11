import { Suspense } from "react";
import { fetchResidences } from "@/lib/actions/residence.action";
import ResidenceCard from "@/components/ResidenceCard";
import { ResidencesSkeleton } from "@/components/skeletons/ResidencesSkeleton";
import Navbar from "@/components/navigation/Navbar";
import { SectionHeader } from "@/components/SectionHeader";
import { PaginationControls } from "@/components/PaginationControls";

const LIMIT = 9;

type SearchParams = {
  city?: string;
  completionStatus?: string;
  page?: string;
};

type ResidencesPageProps = {
  searchParams: Promise<SearchParams>;
};

async function ResidencesContent({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const result = await fetchResidences({
    city: searchParams?.city,
    completionStatus: searchParams?.completionStatus as ResidenceCompletionStatus | undefined,
    isPublished: true,
    page,
    limit: LIMIT,
  });

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les résidences.
      </div>
    );
  }

  const residences = result.data;

  if (!residences?.length) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Aucune résidence trouvée pour ces critères.
      </div>
    );
  }

  const totalPages = Math.ceil((result.total ?? 0) / LIMIT);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {residences.map((residence) => (
          <ResidenceCard key={residence._id} residence={residence} />
        ))}
      </div>
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default async function ResidencesPage({ searchParams }: ResidencesPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen">
      <div className="bg-black">
        <Navbar variant="solid" />
      </div>
      <section className="relative container mx-auto py-10 px-3">
        <div className="mb-8 text-center">
          <SectionHeader
            title="Nos Résidences"
            subtitle="Découvrez nos nouveaux programmes immobiliers d'exception"
          />
        </div>

        <Suspense fallback={<ResidencesSkeleton />}>
          <div className="mt-8 space-y-4">
            <ResidencesContent searchParams={params} />
          </div>
        </Suspense>
      </section>
    </main>
  );
}
