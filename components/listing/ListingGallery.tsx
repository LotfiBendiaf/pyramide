"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { downloadListingImages } from "@/lib/utils/download";

interface ImageData {
  url: string;
  isPublic: boolean;
}

interface ListingGalleryProps {
  images?: ImageData[];
  isStaff?: boolean;
}

export default function ListingGallery({
  images,
  isStaff = false,
}: ListingGalleryProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleImages = isStaff
    ? images || []
    : (images || []).filter((img) => img.isPublic);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + visibleImages.length) % visibleImages.length : 0));
  const next = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % visibleImages.length : 0));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i !== null ? (i - 1 + visibleImages.length) % visibleImages.length : 0));
      else if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null ? (i + 1) % visibleImages.length : 0));
      else if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, visibleImages.length]);

  const handleDownloadImages = async () => {
    setIsDownloading(true);
    try {
      await downloadListingImages(visibleImages);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (visibleImages.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-muted h-[300px] md:h-[420px] flex items-center justify-center">
        <p className="text-muted-foreground">Aucune image disponible</p>
      </div>
    );
  }

  const thumbnails = visibleImages.slice(1, 5);
  const extraCount = visibleImages.length - 5;

  return (
    <div className="space-y-4">
      {/* Grid layout */}
      <div className="rounded-2xl overflow-hidden h-[260px] md:h-[420px]">
        {/* Mobile: single main image with "voir tout" button */}
        <div className="relative h-full md:hidden cursor-pointer" onClick={() => openLightbox(0)}>
          <Image
            src={visibleImages[0].url}
            alt="Listing image principale"
            fill
            className="object-cover"
            priority
          />
          {isStaff && !visibleImages[0].isPublic && (
            <Badge variant="secondary" className="absolute top-3 left-3 z-10 text-xs">
              Interne uniquement
            </Badge>
          )}
          <button
            className="absolute bottom-3 right-3 z-10 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full"
            onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
          >
            Voir {visibleImages.length} photos
          </button>
        </div>

        {/* Desktop: main image + 2x2 grid */}
        <div className="hidden md:grid grid-cols-2 gap-2 h-full">
          {/* Main image */}
          <div
            className="relative h-full cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={visibleImages[0].url}
              alt="Listing image principale"
              fill
              className="object-cover group-hover:brightness-95 transition-all"
              priority
            />
            {isStaff && !visibleImages[0].isPublic && (
              <Badge variant="secondary" className="absolute top-4 left-4 z-10">
                Interne uniquement
              </Badge>
            )}
          </div>

          {/* 2x2 thumbnails */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {Array.from({ length: 4 }).map((_, i) => {
              const img = thumbnails[i];
              const originalIndex = i + 1;
              const isLastSlot = i === 3 && extraCount > 0;

              if (!img) {
                return <div key={i} className="bg-muted" />;
              }
              return (
                <div
                  key={i}
                  className="relative cursor-pointer group overflow-hidden"
                  onClick={() => openLightbox(originalIndex)}
                >
                  <Image
                    src={img.url}
                    alt={`Listing image ${originalIndex + 1}`}
                    fill
                    className="object-cover group-hover:brightness-95 transition-all"
                  />
                  {isStaff && !img.isPublic && !isLastSlot && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 z-10 text-xs"
                    >
                      Interne
                    </Badge>
                  )}
                  {isLastSlot && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        +{extraCount + 1} photos
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Download button */}
      {isStaff && (
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadImages}
            disabled={isDownloading}
            variant="outline"
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Télécharger les images
              </>
            )}
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={closeLightbox}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/70 text-sm">
              {lightboxIndex + 1} / {visibleImages.length}
            </span>
            {isStaff && !visibleImages[lightboxIndex].isPublic && (
              <Badge variant="secondary" className="text-xs">
                Interne uniquement
              </Badge>
            )}
            <button
              className="text-white/70 hover:text-white transition-colors"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex-1 relative flex items-center justify-center px-12 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={visibleImages[lightboxIndex].url}
              alt={`Listing image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
            <button
              className="absolute left-2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              onClick={prev}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              onClick={next}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div
            className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {visibleImages.map((img, i) => (
              <button
                key={i}
                className={`relative shrink-0 w-16 h-12 rounded overflow-hidden ring-2 transition-all ${
                  i === lightboxIndex ? "ring-white" : "ring-transparent opacity-50 hover:opacity-80"
                }`}
                onClick={() => setLightboxIndex(i)}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
