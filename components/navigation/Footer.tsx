"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import Logo2 from "../Logo2";
import PhoneActionLink from "@/components/PhoneActionLink";

const quickLinks = [
  { name: "Acheter", href: "/listings?status=En%20Vente" },
  { name: "Louer", href: "/listings?status=En%20Location" },
  { name: "Notre expertise", href: "/#expertise" },
  { name: "Qui sommes-nous", href: "/#about" },
];

const propertyTypes = [
  { name: "Appartements", href: "/listings?propertyType=Appartement" },
  { name: "Maisons", href: "/listings?propertyType=Maison" },
  { name: "Villas", href: "/listings?propertyType=Villa" },
  { name: "Locaux commerciaux", href: "/listings?propertyType=Commercial" },
];

const contactInfo = [
  {
    icon: Phone,
    label: "Téléphone",
    text: "0779 07 97 06",
    phone: "+213779079706",
  },
  {
    icon: Phone,
    label: "Téléphone",
    text: "0556 51 00 00",
    phone: "+213556510000",
  },
  {
    icon: Mail,
    label: "E-mail",
    text: "contact@pyramideimmobilier.com",
    href: "mailto:contact@pyramideimmobilier.com",
  },
  { icon: MapPin, label: "Localisation", text: "Oran, Algérie" },
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

const linkClass =
  "group inline-flex items-center gap-2 text-sm text-stone-400 transition-colors duration-200 hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70";

function FooterLink({ name, href }: { name: string; href: string }) {
  return (
    <Link href={href} className={linkClass}>
      <ArrowRight className="size-3.5 text-amber-500/70 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber-400" />
      <span>{name}</span>
    </Link>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#15120f] text-stone-300">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-36 size-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="mb-14 flex flex-col gap-7 rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
              <Sparkles className="size-3.5" />
              Votre projet commence ici
            </div>
            <h2 className="text-balance text-2xl font-medium leading-tight text-white sm:text-3xl">
              Parlons de votre prochain projet immobilier.
            </h2>
          </div>
          <Link
            href="/#contact"
            className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-full bg-[#f0dfcb] px-5 py-3 text-sm font-semibold text-[#271c13] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-amber-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120f]"
          >
            Nous contacter
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.35fr] lg:gap-12">
          <div>
            <Link
              href="/"
              aria-label="Pyramide Immobilier — Accueil"
              className="inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              <Logo2 />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-stone-400">
              Votre partenaire de confiance à Oran pour acheter, vendre ou louer
              un bien en toute sérénité.
            </p>
            <div className="mt-6 flex gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-stone-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                >
                  <social.icon className="size-[17px]" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                <ArrowUpRight className="size-3.5" />
              </span>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                Explorer
              </h3>
            </div>
            <ul className="space-y-3.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                <Building2 className="size-3.5" />
              </span>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                Nos biens
              </h3>
            </div>
            <ul className="space-y-3.5">
              {propertyTypes.map((type) => (
                <li key={type.name}>
                  <FooterLink {...type} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                <Mail className="size-3.5" />
              </span>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                Nous joindre
              </h3>
            </div>
            <ul className="space-y-4">
              {contactInfo.map((info) => (
                <li
                  key={`${info.label}-${info.text}`}
                  className="group flex min-w-0 items-start gap-3"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-stone-400 transition-colors group-hover:border-amber-400/20 group-hover:text-amber-400">
                    <info.icon className="size-3.5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-widest text-stone-600">
                      {info.label}
                    </span>
                    {info.phone ? (
                      <PhoneActionLink
                        phone={info.phone}
                        label={info.text}
                        showIcon={false}
                        className="mt-0.5 block text-sm text-stone-300 transition-colors hover:text-amber-300 hover:no-underline"
                      />
                    ) : info.href ? (
                      <a
                        href={info.href}
                        className="mt-0.5 block break-all text-sm text-stone-300 transition-colors hover:text-amber-300"
                      >
                        {info.text}
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-sm text-stone-300">
                        {info.text}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Pyramide Immobilier. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="transition-colors hover:text-stone-200"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-stone-200"
            >
              Conditions d&apos;utilisation
            </Link>
            <span
              className="hidden h-3 w-px bg-white/15 lg:block"
              aria-hidden="true"
            />
            <a
              href="https://deevdigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-stone-200 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              Developed by
              <span className="font-semibold tracking-wide text-stone-300 transition-colors group-hover:text-amber-300">
                DEEV DIGITAL
              </span>
              <ArrowUpRight className="size-3 text-amber-500/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
