"use client";

import { Home, Key, Award, Users, LucideIcon } from "lucide-react";
import Link from "next/link";

interface NavLinksProps {
  closeMenu?: () => void;
}

interface NavCategory {
  name: string;
  href: string;
  icon?: LucideIcon;
}

const categories: NavCategory[] = [
  {
    name: "Acheter",
    href: "/listings?status=En%20Vente",
    icon: Home,
  },
  {
    name: "Louer",
    href: "/listings?status=En%20Location",
    icon: Key,
  },
  {
    name: "Notre Expertise",
    href: "/#expertise",
    icon: Award,
  },
  {
    name: "Qui sommes-nous",
    href: "/#about",
    icon: Users,
  },
];

const NavLinks: React.FC<NavLinksProps> = ({ closeMenu }) => {
  return (
    <nav className="mx-5">
      <ul className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-10 lg:border lg:border-white/20 lg:px-8 lg:py-3 lg:rounded-full lg:bg-white/5 lg:backdrop-blur-sm">
        {categories.map((category) => (
          <li
            key={category.name}
            className="relative flex items-center gap-2 text-white group"
          >
            {category.icon && (
              <category.icon
                size={16}
                className="text-white/70 group-hover:text-orange-600 transition-colors"
              />
            )}
            <Link
              href={category.href}
              onClick={closeMenu}
              className="text-sm font-medium transition-all hover:text-orange-600 text-nowrap"
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
