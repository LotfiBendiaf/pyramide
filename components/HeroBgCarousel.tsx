"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

const bgImages = [
  "/pyramide-img.jpg",
  "/pyramide-img2.jpg",
  "/pyramide-img3.jpg",
];

export default function HeroBgCarousel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[90vh] w-full">
      {/* BACKGROUND IMAGES CAROUSEL */}
      <Carousel
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        className="absolute inset-0 w-full min-h-[90vh]"
      >
        <CarouselContent className="min-h-[90vh]">
          {bgImages.map((src, i) => (
            <CarouselItem key={i} className="relative lg:min-h-[90vh] w-full">
              <Image
                src={src}
                alt={`Background ${i}`}
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="object-cover brightness-[0.65] transition-all duration-700"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 min-h-[90vh] flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
}
