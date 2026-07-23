import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";

const features = [
  "Une équipe d'agents qualifiés et dévoués",
  "Accompagnement personnalisé à chaque étape",
  "Connaissance approfondie du marché local",
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/pyramide-img.jpg"
                alt="Notre équipe Pyramide Immobilier"
                fill
                className="object-cover"
              />
            </div>
            {/* <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg hidden md:block">
              <p className="text-4xl font-bold">10+</p>
              <p className="text-sm">Années d&apos;expérience</p>
            </div> */}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-primary font-medium mb-2">Qui sommes-nous</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Votre partenaire de confiance en immobilier
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Pyramide Immobilier est une agence immobilière de premier plan,
                dédiée à vous accompagner dans tous vos projets immobiliers. Que
                vous souhaitiez acheter, vendre ou louer, notre équipe
                d&apos;experts est là pour vous guider à chaque étape.
              </p>
            </div>

            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground leading-relaxed">
              Notre mission est de rendre l&apos;expérience immobilière simple,
              transparente et satisfaisante pour tous nos clients. Nous croyons
              en des relations durables basées sur la confiance et
              l&apos;intégrité.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/70 text-yellow-400/70"}`}
                  />
                ))}
              </div>
              <div>
                <span className="font-bold text-foreground text-lg">4,7</span>
                <span className="text-muted-foreground text-sm ml-1">
                  / 5 sur Google
                </span>
                <p className="text-muted-foreground text-sm">
                  Basé sur 85 avis clients
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
