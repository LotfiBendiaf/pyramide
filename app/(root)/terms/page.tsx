import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'Utilisation | Pyramide Immobilier",
  description:
    "Conditions générales d'utilisation du site Pyramide Immobilier - Règles et responsabilités pour l'utilisation de nos services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Conditions d&apos;Utilisation
        </h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              1. Acceptation des Conditions
            </h2>
            <p className="text-gray-600 leading-relaxed">
              En accédant et en utilisant le site web de Pyramide Immobilier,
              vous acceptez d&apos;être lié par ces conditions
              d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions,
              veuillez ne pas utiliser notre site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              2. Description des Services
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pyramide Immobilier est une agence immobilière proposant des
              services de :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Vente de biens immobiliers</li>
              <li>Location de biens immobiliers</li>
              <li>Conseil et accompagnement dans vos projets immobiliers</li>
              <li>Estimation de biens immobiliers</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              3. Utilisation du Site
            </h2>
            <p className="text-gray-600 leading-relaxed">
              En utilisant notre site, vous vous engagez à :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Fournir des informations exactes et à jour</li>
              <li>
                Ne pas utiliser le site à des fins illégales ou non autorisées
              </li>
              <li>Ne pas tenter de compromettre la sécurité du site</li>
              <li>Ne pas reproduire ou copier le contenu sans autorisation</li>
              <li>Respecter les droits de propriété intellectuelle</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              4. Informations sur les Biens
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Les informations concernant les biens immobiliers présentés sur
              notre site (prix, surface, caractéristiques) sont fournies à titre
              indicatif. Bien que nous nous efforcions de maintenir ces
              informations à jour et exactes, elles ne constituent pas une offre
              contractuelle. Les caractéristiques définitives seront confirmées
              lors de la visite du bien et de la signature des documents
              officiels.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              5. Propriété Intellectuelle
            </h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;ensemble du contenu présent sur ce site (textes, images,
              logos, graphiques, vidéos) est la propriété exclusive de Pyramide
              Immobilier ou de ses partenaires. Toute reproduction, distribution
              ou utilisation sans autorisation préalable est strictement
              interdite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              6. Responsabilité
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pyramide Immobilier s&apos;efforce d&apos;assurer
              l&apos;exactitude des informations diffusées sur ce site.
              Toutefois, nous ne pouvons garantir l&apos;exhaustivité ou
              l&apos;exactitude de ces informations. Nous déclinons toute
              responsabilité pour :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Les erreurs ou omissions dans le contenu du site</li>
              <li>Les dommages résultant de l&apos;utilisation du site</li>
              <li>L&apos;indisponibilité temporaire du site</li>
              <li>
                Les contenus des sites tiers auxquels nous pouvons faire
                référence
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              7. Honoraires et Commissions
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Les honoraires d&apos;agence sont mentionnés dans chaque annonce
              lorsqu&apos;ils s&apos;appliquent. Ils sont exprimés TTC (Toutes
              Taxes Comprises) et sont à la charge de l&apos;acquéreur ou du
              locataire, sauf mention contraire. Les conditions exactes de
              rémunération seront précisées dans le mandat ou le contrat de
              location.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              8. Protection des Données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              La collecte et le traitement de vos données personnelles sont
              régis par notre{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Politique de Confidentialité
              </a>
              . En utilisant notre site, vous consentez à cette politique.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              9. Modification des Conditions
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pyramide Immobilier se réserve le droit de modifier ces conditions
              d&apos;utilisation à tout moment. Les modifications prendront
              effet dès leur publication sur le site. Nous vous encourageons à
              consulter régulièrement cette page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              10. Droit Applicable
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ces conditions d&apos;utilisation sont régies par le droit
              algérien. Tout litige relatif à l&apos;interprétation ou à
              l&apos;exécution de ces conditions sera soumis à la compétence
              exclusive des tribunaux d&apos;Oran.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              11. Contact
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question concernant ces conditions d&apos;utilisation,
              vous pouvez nous contacter :
            </p>
            <ul className="list-none text-gray-600 space-y-2 ml-4">
              <li>Email : contact@pyramideimmobilier.com</li>
              <li>Téléphone : 0779 07 97 06 / 0792 11 65 96</li>
              <li>Adresse : Oran, Algérie</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
