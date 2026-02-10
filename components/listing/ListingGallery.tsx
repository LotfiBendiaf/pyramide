"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

interface ImageData {
  url: string;
  isPublic: boolean;
}

interface ListingGalleryProps {
  images: ImageData[];
  isStaff?: boolean;
}

export default function ListingGallery({
  images,
  isStaff = false,
}: ListingGalleryProps) {
  // Filter images based on user role
  const visibleImages = isStaff ? images : images.filter((img) => img.isPublic);

  if (visibleImages.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-muted h-[420px] flex items-center justify-center">
        <p className="text-muted-foreground">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <Carousel className="rounded-2xl overflow-hidden relative">
      <CarouselContent>
        {visibleImages.map((img, i) => (
          <CarouselItem key={i}>
            <div className="relative h-[420px] w-full">
              <Image
                src={img.url}
                alt="Listing image"
                fill
                className="object-cover"
                priority={i === 0}
              />
              {isStaff && !img.isPublic && (
                <Badge
                  variant="secondary"
                  className="absolute top-4 left-4 z-10"
                >
                  Interne uniquement
                </Badge>
              )}
              {/* Image counter */}
              <Badge
                variant="secondary"
                className="absolute bottom-4 right-4 z-10 bg-black/50 text-white"
              >
                {i + 1} / {visibleImages.length}
              </Badge>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}
