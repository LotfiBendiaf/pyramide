"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export default function ListingGallery({ images }: { images: string[] }) {
  return (
    <Carousel className="rounded-2xl overflow-hidden">
      <CarouselContent>
        {images.map((img, i) => (
          <CarouselItem key={i}>
            <div className="relative h-[420px] w-full">
              <Image
                src={img}
                alt="Listing image"
                fill
                className="object-cover"
                priority={i === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
