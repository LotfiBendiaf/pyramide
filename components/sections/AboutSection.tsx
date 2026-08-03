import Image from "next/image";
import { CheckCircle2, Quote, Star } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const features = [
  "Une équipe d'agents qualifiés et dévoués",
  "Accompagnement personnalisé à chaque étape",
  "Connaissance approfondie du marché local",
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-third/45 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-secondary/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4">
        <SectionHeader
          title="Qui sommes-nous ?"
          subtitle="Une expertise locale, une écoute attentive et un accompagnement pensé autour de votre projet."
          watermark="À PROPOS"
          className="mb-12 md:mb-16"
        />

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="absolute -left-4 -top-4 h-28 w-28 rounded-tl-[2rem] border-l border-t border-primary/25 md:-left-7 md:-top-7" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-muted shadow-[0_24px_70px_-30px_rgba(51,34,18,0.55)]">
              <Image
                src="/pyramide-img.jpg"
                alt="L'équipe de Pyramide Immobilier"
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-6 right-4 flex max-w-[17rem] items-start gap-3 rounded-2xl border border-white/40 bg-background/95 p-4 shadow-xl backdrop-blur md:-right-5 md:bottom-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Quote className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground">
                Votre projet mérite un accompagnement à sa mesure.
              </p>
            </div>
          </div>

          <div className="pt-5 lg:pt-0">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              L&apos;immobilier, en toute confiance
            </p>
            <h3 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
              Bien plus qu&apos;une agence, votre partenaire immobilier.
            </h3>
            <p className="mt-6 text-base leading-7 text-muted-foreground md:text-lg">
              Pyramide Immobilier vous accompagne dans tous vos projets. Achat,
              vente ou location : notre équipe d&apos;experts transforme chaque
              étape en une expérience simple, claire et sereine.
            </p>

            <ul className="mt-8 grid gap-3">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 rounded-xl border border-primary/10 bg-background/65 px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-background"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground md:text-base">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-4 border-t border-primary/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Des relations durables fondées sur la transparence,
                l&apos;intégrité et les résultats.
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex gap-0.5" aria-label="Note de 4,7 sur 5">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-foreground">4,7 / 5</p>
                  <p className="text-xs text-muted-foreground">85 avis Google</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
