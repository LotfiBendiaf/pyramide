import { Home, Key, FileText, Users, TrendingUp, Shield } from "lucide-react";

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
    <section id="expertise" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-medium mb-2">Nos Services</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Notre Expertise à Votre Service
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez l&apos;ensemble de nos services conçus pour répondre à tous
            vos besoins immobiliers avec professionnalisme et efficacité.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
