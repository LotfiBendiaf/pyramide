"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { routeTitles } from "@/constants/values";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import Theme from "../navigation/Theme";
import ROUTES from "@/constants/routes";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "../ui/button";
import { useBreadcrumbTitle } from "../navigation/BreadcrumbTitleContext";
import { House } from "lucide-react";

interface SiteHeaderProps {
  title?: string;
  dynamic?: boolean;
}

export function SiteHeader({ title, dynamic = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const { title: contextTitle } = useBreadcrumbTitle();

  // Get all path segments (excluding empty ones)
  const segments = pathname.split("/").filter(Boolean);

  const hideBreadcrumbs =
    (pathname.includes("/artworks/") &&
      !pathname.includes("add") &&
      !pathname.includes("edit") &&
      !dynamic) ||
    (pathname.includes("/projects/") && !pathname.includes("add") && !dynamic);

  // Resolve title
  const dynamicTitle =
    contextTitle ||
    title ||
    routeTitles[pathname] ||
    segments[segments.length - 1]?.replace(/-/g, " ").toUpperCase() ||
    "Page";

  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const label =
      routeTitles[href] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return (
      <div key={href}>
        {isLast ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{contextTitle ?? title ?? label}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <div className="flex items-center gap-3">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={href}>{label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </div>
        )}
      </div>
    );
  });

  return (
    !hideBreadcrumbs && (
      <header className="mb-3 h-(--header-height) min-w-0 shrink-0 items-center gap-2 border-b p-3 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sm:pr-5 lg:pr-10">
        <div className="flex min-w-0 w-full items-center gap-1 py-2 lg:gap-2">
          <SidebarTrigger className="shrink-0" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="syncopate min-w-0 truncate text-base sm:text-lg md:text-xl lg:text-3xl">
            {dynamicTitle}
          </h1>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationBell />
            <Theme />

            {/* <Button
              variant="outline"
              asChild
              size="sm"
              className="hidden sm:flex"
            >
              <NotificationsBell />
            </Button> */}
            <Button asChild size="sm" className="px-2 sm:px-3">
              <Link href={ROUTES.HOME} aria-label="Ouvrir le site principal">
                <House className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Site principal</span>
              </Link>
            </Button>
          </div>
        </div>
        {/* Breadcrumbs */}
        {segments.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
          </Breadcrumb>
        )}
      </header>
    )
  );
}
