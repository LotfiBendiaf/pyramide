"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

const bgImages = ["/immo1.jpg", "/immo2.jpg", "/immo3.jpg", "/immo4.jpg"];

export default function HeroBgCarousel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-full mb-20">
      {/* BACKGROUND IMAGES CAROUSEL */}
      <Carousel
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: false,
          }),
        ]}
        className="absolute inset-0 w-full h-screen"
      >
        <CarouselContent className="h-screen">
          {bgImages.map((src, i) => (
            <CarouselItem key={i} className="relative h-full w-full">
              <Image
                src={src}
                alt={`Background ${i}`}
                fill
                className="object-cover brightness-[0.65] transition-all duration-700"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 h-screen">{children}</div>
    </div>
  );
}
