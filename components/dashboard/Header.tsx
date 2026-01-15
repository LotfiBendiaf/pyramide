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

interface SiteHeaderProps {
  title?: string;
  dynamic?: boolean;
}

export function SiteHeader({ title, dynamic = false }: SiteHeaderProps) {
  const pathname = usePathname();

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
            <BreadcrumbPage>{title ? title : label}</BreadcrumbPage>
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
      <header className=" h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) p-3 pr-10 mb-3">
        <div className="flex w-full items-center gap-1 py-2 lg:gap-2">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-lg md:text-xl lg:text-3xl syncopate">
            {dynamicTitle}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {/* <NotificationBell response={response} /> */}
            <Theme />

            {/* <Button
              variant="outline"
              asChild
              size="sm"
              className="hidden sm:flex"
            >
              <NotificationsBell />
            </Button> */}
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
