import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { fetchResidences } from "@/lib/actions/residence.action";
import ResidenceCard from "../ResidenceCard";
import { ResidencesSkeleton } from "../skeletons/ResidencesSkeleton";
import ROUTES from "@/constants/routes";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const ResidencesContent = async () => {
  const result = await fetchResidences({
    isPublished: true,
    isFeatured: true,
    limit: 8,
  });

  if (!result.success) {
    return (
      <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
        Impossible de charger les résidences.
      </div>
    );
  }

  const residences = result.data;

  if (!residences?.length) {
    return (
      <div className="rounded-xl border border-dashed border-primary/15 bg-third/20 px-6 py-16 text-center">
        <p className="font-medium text-foreground">
          Nos prochains programmes immobiliers arrivent bientôt.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Découvrez entre-temps l&apos;ensemble de nos biens disponibles.
        </p>
      </div>
    );
  }

  return (
    <Carousel opts={{ align: "start", loop: residences.length > 3 }}>
      <CarouselContent>
        {residences.map((residence) => (
          <CarouselItem key={residence._id} className="sm:basis-1/2 lg:basis-1/3">
            <ResidenceCard residence={residence} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {residences.length > 3 && (
        <div className="mt-4 hidden justify-end gap-2 md:flex">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      )}
    </Carousel>
  );
};

export default function ResidencesSection() {
  return (
    <section
      id="residences"
      className="relative border-t border-primary/[0.08] px-3 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute left-0 top-24 h-56 w-56 rounded-full bg-third/45 blur-3xl"
        aria-hidden="true"
      />

      <SectionHeader
        title="Résidences"
        subtitle="Découvrez nos nouveaux programmes immobiliers, de la réservation à la livraison."
        watermark="RESIDENCES"
        buttonHref={ROUTES.RESIDENCES}
        buttonLabel="Explorer les résidences"
        className="mb-12 md:mb-16"
      />

      <div className="relative">
        <Suspense fallback={<ResidencesSkeleton />}>
          <ResidencesContent />
        </Suspense>
      </div>

      <Link
        href={ROUTES.RESIDENCES}
        className="mt-8 flex items-center justify-center gap-2 border-t border-primary/10 pt-5 text-sm font-semibold text-primary md:hidden"
      >
        Explorer les résidences
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
