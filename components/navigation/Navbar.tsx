"use client";

import React, { useState } from "react";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useSession } from "next-auth/react";
import LogoutButton from "@/components/LogoutButton";
import { ArrowRight, Bell, Loader, Menu, User } from "lucide-react";
import NavLinks from "./NavLinks";
import Theme from "./Theme";
import Logo2 from "../Logo2";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session, status } = useSession();
  const user = session?.user;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav>
      <div className="absolute top-0 z-20 p-10 w-full">
        <div className="flex items-center justify-between py-2">
          {/* Logo for desktop */}
          <Link className="hidden md:block flex-1 space-y-1" href={ROUTES.HOME}>
            <Logo2 />
          </Link>

          {/* Logo for mobile */}
          <Link className="md:hidden flex-1" href={ROUTES.HOME}>
            <Logo format="mini" />
          </Link>

          {/* Main nav links (visible on large screens) */}
          <div className="hidden lg:flex lg:flex-2">
            <NavLinks />
          </div>

          {/* Right section (theme + auth + hamburger) */}
          <div className="flex items-center justify-end gap-2 lg:gap-4 flex-1 text-white">
            <Theme />
            <Button variant={"ghost"} className="relative w-8 h-8">
              <Bell size={20} />
              <div className="absolute top-0 right-0 size-2 rounded-full bg-green-500"></div>
            </Button>
            {status === "authenticated" && user ? (
              <>
                {/* <Avatar id={user.id} /> */}
                <Link href={ROUTES.DASHBOARD} className="hidden md:inline-flex">
                  <Button>
                    Espace Admin <ArrowRight />
                  </Button>
                </Link>
              </>
            ) : status === "loading" ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Link
                  href={ROUTES.SIMULATION}
                  className="hidden md:inline-flex"
                >
                  <Button>
                    Nous Contacter <ArrowRight />
                  </Button>
                </Link>
                <Button variant={"secondary"}>
                  <Link href={ROUTES.SIGN_IN} className="hidden md:inline-flex">
                    <User />
                  </Link>
                </Button>
              </>
            )}

            {/* Hamburger for mobile */}
            <Button
              variant={"ghost"}
              className="lg:hidden text-foreground"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <Menu className="size-5 " />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-950 shadow-md p-10 space-y-10">
          <NavLinks closeMenu={closeMobileMenu} />

          {user ? (
            <>
              <Link href={ROUTES.DASHBOARD} onClick={closeMobileMenu}>
                <Button className="w-full mb-4">
                  Espace Admin
                  <ArrowRight />
                </Button>
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link href={ROUTES.SIGN_IN}>
              <Button>Se Connecter</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
