"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { SectionHeader } from "@/components/SectionHeader";

const reviews = [
  {
    name: "Ilies Douar",
    date: "Il y a 5 mois",
    text: "Un grand merci à Pyramide Immobilier et notamment à Rafik pour leur professionnalisme et leur efficacité. Je leur ai confié la vente de ma villa, et tout s'est déroulé rapidement et en toute transparence. Je recommande vivement leurs services à toute personne souhaitant acheter ou vendre en toute sérénité.",
  },
  {
    name: "Mokrane Dalila",
    date: "Il y a 6 mois",
    text: "Un grand merci à l'agent Rafik, qui m'a accompagnée et guidée tout au long de mes recherches. L'agence m'a aidée à trouver mon nouveau duplex en moins de 24 heures ! Grâce à leur professionnalisme et leur efficacité, je recommande vivement l'agence Pyramide.",
  },
  {
    name: "Rania Iness Taa",
    date: "Il y a 3 mois",
    text: "Un accompagnement complet et global du début à la fin, par une équipe jeune, motivée et déterminée. Je les recommande vivement ; je suis très satisfaite de leur professionnalisme. Un merci tout particulier à Zinou et Ryad. Bonne continuation !",
  },
  {
    name: "Razan Rahou",
    date: "Il y a 9 mois",
    text: "Excellente agence ! Une équipe sérieuse, rapide et véritablement professionnelle. Un grand merci à l'agent Rafik, très sympathique et efficace. Je les recommande vivement.",
  },
  {
    name: "Souhila Naili",
    date: "Il y a 4 mois",
    text: "Un grand merci à toute l'équipe, et tout particulièrement à Islem et Zinou ! Je suis absolument ravie du travail qu'ils ont accompli. Ils ont géré la vente de mon appartement avec un sérieux et un professionnalisme exemplaires.",
  },
  {
    name: "Chayma Hassaine",
    date: "Il y a 1 an",
    text: "Je tiens à remercier les membres de l'agence Pyramide, qui ont été d'une aide précieuse et d'une grande gentillesse. Ils sont très accueillants et à l'écoute de leurs clients. La meilleure agence d'Algérie !",
  },
  {
    name: "Zerga Abed",
    date: "Il y a 6 mois",
    text: "Un grand merci à l'agence Pyramide. Rafik et Islem ont été très professionnels, disponibles et attentifs. Grâce à eux, tout s'est déroulé dans les meilleures conditions et avec beaucoup de sérieux. Je les recommande vivement !",
  },
  {
    name: "Rhoni Aichaa",
    date: "Il y a 6 mois",
    text: "J'ai acheté ma maison via Pyramide Immobilier, et je suis très satisfaite. L'équipe était professionnelle, disponible et à l'écoute de mes besoins. Tout s'est déroulé sans le moindre souci, et je recommande vivement cette agence.",
  },
  {
    name: "Kira Benyamina",
    date: "Il y a 7 mois",
    text: "Je tiens à remercier chaleureusement toute l'équipe de l'agence pour son professionnalisme. Une mention spéciale à Rafik, toujours disponible, attentif et très professionnel ; grâce à lui, tout s'est parfaitement déroulé, sans aucun stress.",
  },
  {
    name: "Mellouki Mohamed",
    date: "Il y a 9 mois",
    text: "Franchement, au top ! L'une des meilleures agences immobilières d'Oran. Très à l'écoute et d'une efficacité remarquable pour les ventes. Foncez ! Merci à Rafik et à son collègue pour leur accueil chaleureux.",
  },
  {
    name: "Abdallah Kendouci",
    date: "Il y a 8 mois",
    text: "J'ai reçu un accueil très chaleureux ; le service était simple, professionnel et convivial. Ce fut un vrai plaisir, merci à toute l'équipe !",
  },
  {
    name: "Yaser Berrabha",
    date: "Il y a 3 mois",
    text: "Un service professionnel, un accueil chaleureux et un travail de grande qualité. Tout s'est déroulé très fluidement du début à la fin. Je les recommande vivement.",
  },
];

const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 flex-shrink-0"
    aria-label="Google"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function ReviewsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      id="reviews"
      className="relative overflow-hidden border-t border-primary/[0.08] bg-third/20 py-20 md:py-28"
    >
      <div className="container relative mx-auto px-4">
        <SectionHeader
          title="Ils nous font confiance"
          subtitle="Des expériences partagées par celles et ceux que nous avons accompagnés dans leur projet immobilier."
          watermark="AVIS"
          className="mb-10 md:mb-12"
          action={
            <div className="flex items-center gap-3 rounded-full border border-primary/10 bg-background/70 px-4 py-2.5">
              <div className="flex gap-0.5" aria-label="Note de 4,7 sur 5">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">4,7</span>
              <span className="text-xs text-muted-foreground">
                85 avis Google
              </span>
            </div>
          }
        />

        <div className="relative">
          <div className="mb-4 flex justify-end gap-2">
            <button
              onClick={scrollPrev}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-background/70 text-foreground transition-colors hover:border-primary/25 hover:bg-background"
              aria-label="Avis précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollNext}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-background/70 text-foreground transition-colors hover:border-primary/25 hover:bg-background"
              aria-label="Avis suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {reviews.map((review, index) => (
                <article
                  key={index}
                  className="flex min-h-80 w-[90%] flex-none flex-col rounded-xl border border-primary/[0.08] bg-card/80 p-6 sm:w-[calc(50%_-_0.5rem)] lg:w-[calc(33.333%_-_0.7rem)]"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex gap-0.5" aria-hidden="true">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <GoogleIcon />
                  </div>

                  <Quote className="mb-3 h-4 w-4 text-primary/20" />
                  <p className="mb-5 flex-1 text-sm leading-6 text-muted-foreground">
                    {review.text}
                  </p>

                  <div className="flex items-center justify-between gap-3 border-t border-primary/[0.08] pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-third">
                        <span className="text-primary text-xs font-semibold">
                          {review.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {review.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
