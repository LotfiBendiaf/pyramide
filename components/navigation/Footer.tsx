"use client";

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
import PhoneActionLink from "@/components/PhoneActionLink";

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
  { icon: Phone, text: "0779 07 97 06", phone: "+213779079706" },
  { icon: Phone, text: "0556 51 00 00", phone: "+213556510000" },
  {
    icon: Mail,
    text: "contact@pyramideimmobilier.com",
    href: "mailto:contact@pyramideimmobilier.com",
  },
  { icon: MapPin, text: "Oran, Algérie", href: null },
];

const socialLinks = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/p/Agence-Pyramide-immobilier-100084715556211/",
    label: "Facebook",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/pyramide_immobilier/",
    label: "Instagram",
  },
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
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:text-orange-600 transition-colors"
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
                    className="text-sm hover:text-orange-600 transition-colors"
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
                    className="text-sm hover:text-orange-600 transition-colors"
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
                  <info.icon className="h-5 w-5 flex-shrink-0" />
                  {"phone" in info ? (
                    <PhoneActionLink
                      phone={info.phone!}
                      label={info.text}
                      showIcon={false}
                      className="text-sm text-gray-300 hover:text-orange-600 hover:no-underline transition-colors cursor-pointer"
                    />
                  ) : info.href ? (
                    <a
                      href={info.href}
                      className="text-sm hover:text-orange-600 transition-colors"
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
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Pyramide Immobilier. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-orange-600 transition-colors"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/terms"
              className="hover:text-orange-600 transition-colors"
            >
              Conditions d&apos;utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
