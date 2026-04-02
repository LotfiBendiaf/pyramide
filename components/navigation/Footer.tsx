"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  PhoneCall,
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
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

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
                    <button
                      onClick={() => setSelectedPhone(info.phone ?? null)}
                      className="text-sm hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {info.text}
                    </button>
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
      {/* Phone choice modal */}
      {selectedPhone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedPhone(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-gray-700 font-semibold text-base mb-1">
              {selectedPhone.replace("+213", "0").replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4")}
            </p>
            <a
              href={`tel:${selectedPhone}`}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 font-medium transition-colors"
              onClick={() => setSelectedPhone(null)}
            >
              <PhoneCall className="h-5 w-5" />
              Appeler
            </a>
            <a
              href={`https://wa.me/${selectedPhone.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors"
              onClick={() => setSelectedPhone(null)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <button
              onClick={() => setSelectedPhone(null)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
