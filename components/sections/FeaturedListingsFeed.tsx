"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { fetchListings } from "@/lib/actions/listings.action";
import { Button } from "@/components/ui/button";

export type FeaturedListingFilters = {
  city?: string;
  status?: "En Vente" | "En Location";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
};

const BATCH_SIZE = 4;

export function FeaturedListingsFeed({
  initialListings,
  total,
  filters,
}: {
  initialListings: Listing[];
  total: number;
  filters: FeaturedListingFilters;
}) {
  const [listings, setListings] = useState(initialListings);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const hasMore = listings.length < total;

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({
      left: direction * scroller.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || pending) return;
        const nextPage = page + 1;
        startTransition(async () => {
          const result = await fetchListings({
            ...filters,
            isFeatured: true,
            isPublished: true,
            isValidated: true,
            page: nextPage,
            limit: BATCH_SIZE,
          });
          if (!result.success) {
            setFailed(true);
            return;
          }
          setFailed(false);
          setListings((current) => {
            const known = new Set(current.map((listing) => listing._id));
            return [...current, ...(result.data ?? []).filter((listing) => !known.has(listing._id))];
          });
          setPage(nextPage);
        });
      },
      { root: scroller.current, rootMargin: "0px 300px 0px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filters, hasMore, page, pending]);

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => scroll(-1)}
          aria-label="Voir les biens précédents"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => scroll(1)}
          aria-label="Voir les biens suivants"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
      >
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%_-_0.75rem)] lg:w-[calc(25%_-_1.125rem)]"
          >
            <ListingCard listing={listing} />
          </div>
        ))}
        {hasMore && (
          <div
            ref={sentinel}
            className="flex min-h-48 w-20 shrink-0 items-center justify-center"
            aria-live="polite"
          >
            {pending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {failed && <span className="text-xs text-destructive">Erreur</span>}
          </div>
        )}
      </div>
    </div>
  );
}
