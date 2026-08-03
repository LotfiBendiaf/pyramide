import { Home, Key, FileText, Users, TrendingUp, Shield } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const services = [
  {
    icon: Home,
    title: "Vente Immobilière",
    description:
      "Nous vous accompagnons dans la vente de votre bien avec une estimation précise et une stratégie marketing efficace.",
  },
  {
    icon: Key,
    title: "Location",
    description:
      "Trouvez le locataire idéal ou le bien parfait à louer grâce à notre service de mise en relation personnalisé.",
  },
  {
    icon: FileText,
    title: "Conseil Juridique",
    description:
      "Bénéficiez de conseils experts pour sécuriser vos transactions et comprendre tous les aspects légaux.",
  },
  {
    icon: TrendingUp,
    title: "Estimation Gratuite",
    description:
      "Obtenez une estimation précise de votre bien basée sur notre connaissance approfondie du marché.",
  },
  {
    icon: Users,
    title: "Accompagnement Personnalisé",
    description:
      "Un agent dédié vous accompagne de la première visite jusqu'à la signature finale.",
  },
  {
    icon: Shield,
    title: "Garantie Confiance",
    description:
      "Transactions sécurisées et transparentes avec un suivi rigoureux à chaque étape.",
  },
];

export default function ExpertiseSection() {
  return (
    <section
      id="expertise"
      className="relative overflow-hidden bg-background py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute -left-32 bottom-10 h-96 w-96 rounded-full bg-third/55 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4">
        <SectionHeader
          title="Notre expertise"
          subtitle="Des solutions immobilières complètes, portées par une équipe engagée à chaque étape de votre projet."
          watermark="SERVICES"
          className="mb-12 md:mb-16"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.title}
              className="group relative overflow-hidden rounded-xl border border-primary/[0.08] bg-card/80 p-6 transition-colors duration-300 hover:border-primary/20 hover:bg-card"
            >
              <span
                className="absolute right-5 top-5 text-[0.65rem] font-semibold tracking-[0.18em] text-primary/25 transition-colors group-hover:text-primary/40"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-third/70 text-primary ring-1 ring-primary/[0.08] transition-colors duration-300 group-hover:bg-third">
                <service.icon className="h-4 w-4" strokeWidth={1.7} />
              </div>

              <h3 className="mb-2.5 text-lg font-semibold tracking-tight text-foreground">
                {service.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {service.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-third/45 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="font-medium text-foreground">
            Un besoin spécifique ? Nous construisons aussi un accompagnement sur
            mesure.
          </p>
          <a
            href="#contact"
            className="w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Parler à un conseiller →
          </a>
        </div>
      </div>
    </section>
  );
}
