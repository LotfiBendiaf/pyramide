import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import Logo2 from "../Logo2";

const quickLinks = [
  { name: "Acheter", href: "/listings?status=En%20Vente" },
  { name: "Louer", href: "/listings?status=En%20Location" },
  { name: "Notre Expertise", href: "/#expertise" },
  { name: "Qui sommes-nous", href: "/#about" },
];

const propertyTypes = [
  { name: "Appartements", href: "/listings?propertyType=Appartement" },
  { name: "Maisons", href: "/listings?propertyType=Maison" },
  { name: "Villas", href: "/listings?propertyType=Villa" },
  { name: "Locaux Commerciaux", href: "/listings?propertyType=Commercial" },
];

const contactInfo = [
  { icon: Phone, text: "+213 00 00 00 00", href: "tel:+21300000000" },
  {
    icon: Mail,
    text: "contact@pyramide.dz",
    href: "mailto:contact@pyramide.dz",
  },
  { icon: MapPin, text: "Oran, Algérie", href: null },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo2 />
            <p className="text-sm leading-relaxed text-gray-400">
              Votre partenaire de confiance pour tous vos projets immobiliers à
              Oran et ses environs. Achat, vente, location - nous sommes là pour
              vous accompagner.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Liens Rapides
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Types de Biens
            </h3>
            <ul className="space-y-2">
              {propertyTypes.map((type) => (
                <li key={type.name}>
                  <Link
                    href={type.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {type.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              {contactInfo.map((info, index) => (
                <li key={index} className="flex items-center gap-3">
                  <info.icon className="h-5 w-5 text-secondary flex-shrink-0" />
                  {info.href ? (
                    <a
                      href={info.href}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {info.text}
                    </a>
                  ) : (
                    <span className="text-sm">{info.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Pyramide Immobilier. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Conditions d&apos;utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
