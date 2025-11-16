"use client";

import { Globe } from "lucide-react";
import Link from "next/link";

interface NavLinksProps {
  closeMenu?: () => void;
}

const categories = [
  {
    name: "Vente",
    href: "/#newprojects",
    icon: Globe,
    sublinks: [],
  },
  {
    name: "Locations",
    href: "/promotions-immobilieres",
    subLinks: [
      // {
      //   name: "Bouhadiba",
      //   href: "/#bouhadiba",
      //   logo: "/images/bouhadiba.png",
      // },
      // {
      //   name: "El Gharb",
      //   href: "/#elgharb",
      //   logo: "/images/ElGharb.png",
      // },
      // {
      //   name: "Eco Prom",
      //   href: "/#ecoprom",
      //   logo: "/images/EcoProm.png",
      // },
    ],
  },
  {
    name: "Notre Expertise",
    href: "/#savoirfaire",
    subLinks: [],
  },
  // {
  //   name: "A propos",
  //   href: "/#apropos",
  //   subLinks: [],
  // },
  {
    name: "Qui sommes nous ?",
    href: "/#apropos",
    subLinks: [],
  },
];

const NavLinks: React.FC<NavLinksProps> = ({ closeMenu }) => {
  return (
    <nav className="flex flex-col lg:flex-row lg:justify-center mx-auto">
      <ul className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-12 border px-10 py-3 rounded-full">
        {categories.map((category) => (
          <li
            key={category.name}
            className="relative z-100 flex items-center gap-2 text-white"
          >
            {category.icon && <category.icon size={16} />}
            <Link
              href={category.href}
              onClick={closeMenu}
              className=" text-sm transition-all hover:text-tertiary"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavLinks;
