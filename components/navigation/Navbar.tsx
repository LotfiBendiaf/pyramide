"use client";

import Link from "next/link";
import ROUTES from "@/constants/routes";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Menu, User, ArrowRight, Loader, Heart } from "lucide-react";

import NavLinks from "./NavLinks";
import Theme from "./Theme";
import Logo2 from "../Logo2";
import LogoutButton from "@/components/LogoutButton";

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <nav className="absolute top-0 w-full px-4 md:px-6 lg:px-20 py-10 z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex-1">
          <Logo2 />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex gap-10 flex-1 justify-center">
          <NavLinks />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 text-white flex-1 justify-end">
          <Theme />

          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 size-2 bg-green-500 rounded-full"></span>
          </Button> */}
          <Link href={ROUTES.WISHLIST} aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>

          {/* Auth state */}
          {status === "authenticated" ? (
            <>
              <Button asChild className="hidden md:inline-flex">
                <Link href={ROUTES.DASHBOARD}>
                  Espace Admin <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </>
          ) : status === "loading" ? (
            <Loader className="animate-spin" />
          ) : (
            <>
              <Button variant="secondary" asChild aria-label="Se connecter">
                <Link href={ROUTES.SIGN_IN} className="hidden md:inline-flex">
                  <User />
                  <span className="sr-only">Se connecter</span>
                </Link>
              </Button>
            </>
          )}

          {/* Mobile Menu (Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="top"
              className="bg-black text-white border-none px-3 py-10"
            >
              <SheetHeader>
                <SheetTitle className="text-white">
                  <Logo2 />
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Menu de Navigation
                </SheetDescription>
              </SheetHeader>

              {/* Menu Links */}
              <NavLinks />
              <SheetFooter className="w-fit">
                {user ? (
                  <>
                    <Button asChild>
                      <Link href={ROUTES.DASHBOARD}>
                        Espace Admin <ArrowRight />
                      </Link>
                    </Button>
                    <LogoutButton />
                  </>
                ) : (
                  <LogoutButton />
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
