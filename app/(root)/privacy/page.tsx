import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Pyramide Immobilier",
  description:
    "Politique de confidentialité de Pyramide Immobilier - Comment nous collectons, utilisons et protégeons vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Politique de Confidentialité
        </h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              1. Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pyramide Immobilier s&apos;engage à protéger la vie privée des
              utilisateurs de son site web. Cette politique de confidentialité
              explique comment nous collectons, utilisons, stockons et protégeons
              vos informations personnelles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              2. Données Collectées
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous pouvons collecter les types de données suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                Informations d&apos;identification : nom, prénom, adresse email,
                numéro de téléphone
              </li>
              <li>
                Informations de navigation : adresse IP, type de navigateur, pages
                visitées
              </li>
              <li>
                Préférences immobilières : types de biens recherchés, budget,
                localisation souhaitée
              </li>
              <li>
                Communications : messages envoyés via nos formulaires de contact
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              3. Utilisation des Données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données personnelles sont utilisées pour :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Répondre à vos demandes de renseignements</li>
              <li>Vous proposer des biens immobiliers correspondant à vos critères</li>
              <li>Améliorer nos services et notre site web</li>
              <li>Vous envoyer des informations sur nos nouveaux biens (avec votre consentement)</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              4. Protection des Données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité appropriées pour
              protéger vos données personnelles contre tout accès non autorisé,
              modification, divulgation ou destruction. Ces mesures incluent le
              chiffrement des données, des pare-feu et des contrôles d&apos;accès
              stricts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              5. Partage des Données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous ne vendons pas vos données personnelles. Nous pouvons partager
              vos informations uniquement dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Avec votre consentement explicite</li>
              <li>Avec nos partenaires de confiance pour fournir nos services</li>
              <li>Pour répondre à des obligations légales</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              6. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Notre site utilise des cookies pour améliorer votre expérience de
              navigation. Les cookies nous permettent de mémoriser vos préférences
              et d&apos;analyser le trafic de notre site. Vous pouvez configurer
              votre navigateur pour refuser les cookies, mais cela pourrait
              affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              7. Vos Droits
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Conformément à la réglementation en vigueur, vous disposez des droits
              suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Droit d&apos;accès à vos données personnelles</li>
              <li>Droit de rectification de vos données</li>
              <li>Droit à l&apos;effacement de vos données</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d&apos;opposition au traitement de vos données</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Pour exercer ces droits, contactez-nous à l&apos;adresse :
              contact@pyramide.dz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              8. Conservation des Données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous conservons vos données personnelles uniquement pendant la durée
              nécessaire aux finalités pour lesquelles elles ont été collectées,
              ou conformément aux exigences légales applicables.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              9. Contact
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question concernant cette politique de confidentialité ou
              vos données personnelles, vous pouvez nous contacter :
            </p>
            <ul className="list-none text-gray-600 space-y-2 ml-4">
              <li>Email : contact@pyramide.dz</li>
              <li>Téléphone : +213 00 00 00 00</li>
              <li>Adresse : Oran, Algérie</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
