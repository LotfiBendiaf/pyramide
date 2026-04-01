"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";

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
    <section id="reviews" className="py-10 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-medium mb-2">Avis Clients</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Ce que disent nos clients
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/70 text-yellow-400/70"}`}
                />
              ))}
            </div>
            <span className="font-bold text-foreground text-lg">4,7 / 5</span>
            <span className="text-muted-foreground text-sm">
              · 85 avis sur Google
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="flex-none w-[90%] sm:w-[45%] lg:w-[30%] bg-card border border-border rounded-xl p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <GoogleIcon />
                  </div>

                  <Quote className="h-5 w-5 text-primary/30 mb-2" />
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                    {review.text}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors z-10"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors z-10"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
