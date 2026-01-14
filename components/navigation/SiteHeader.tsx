"use client";

// CORRECTION: Assurez-vous que les chemins d'accès aux bibliothèques externes (Next.js)
// et aux composants locaux sont correctement résolus.
import Link from "next/link";
import { usePathname } from "next/navigation";
import ROUTES from "@/constants/routes"; // Assumed path: adjust if necessary
import { routeTitles } from "@/constants/values"; // Assumed path: adjust if necessary
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // CORRECTED: Using absolute path from root
import { Home } from "lucide-react";

interface SiteHeaderProps {
  title?: string;
}

// Helper function to capitalize the first letter of each word (for segment fallback)
const toTitleCase = (str: string) => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function SiteHeaderLinks({ title }: SiteHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // --- 1. Dynamic Title Resolution ---
  const dynamicTitle =
    title ||
    routeTitles[pathname] ||
    toTitleCase(segments[segments.length - 1] || "Dashboard"); // Better capitalization fallback

  // --- 2. Breadcrumb Item Generation ---

  // Start with the mandatory root (Dashboard) link
  const initialBreadcrumb: React.ReactNode[] = [
    <BreadcrumbItem key="root">
      <BreadcrumbLink asChild className="flex items-center gap-1">
        <Link href={ROUTES.HOME}>
          <Home className="w-3 h-3 text-muted-foreground" />
          Page principale
        </Link>
      </BreadcrumbLink>
    </BreadcrumbItem>,
    <BreadcrumbSeparator key="sep-root" />,
  ];

  // Map segments to the full path and create items
  const breadcrumbItems = segments.reduce((acc, segment, index) => {
    // Reconstruct the cumulative path
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Resolve the label: 1. Exact map, 2. Title Case fallback
    const label = routeTitles[href] || toTitleCase(segment);

    if (isLast) {
      acc.push(
        <BreadcrumbItem key={href}>
          {/* Use BreadcrumbPage for the current page (non-link) */}
          <BreadcrumbPage className="text-foreground font-semibold">
            {label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else {
      acc.push(
        <BreadcrumbItem key={href}>
          <BreadcrumbLink asChild>
            <Link href={href}>{label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>,
        <BreadcrumbSeparator key={`sep-${href}`} />
      );
    }
    return acc;
  }, initialBreadcrumb);

  // If the current path is just the root, don't show the redundant second separator
  if (segments.length === 0) {
    // Remove the separator added after the root if we are on the root page itself
    breadcrumbItems.pop();
  }

  const last = segments[segments.length - 1];
  // Detect artwork detail page: /artwork/[id]
  // MongoDB ObjectId detection
  const isMongoId = /^[a-f0-9]{24}$/i.test(last);

  // Detect artwork detail page: /artwork/:id
  const isArtworkDetail =
    segments[0] === "artworks" && segments.length === 2 && isMongoId;

  // Detect artist detail page: /artists/:id
  const isArtistDetail =
    segments[0] === "artists" && segments.length === 2 && isMongoId;

  const isSubscriptionDetail =
    segments[0] === "subscriptions" && segments.length === 2 && isMongoId;

  const isExhibitionDetail =
    segments[0] === "exhibitions" && segments.length === 2 && isMongoId;

  if (
    pathname === "/" ||
    isArtworkDetail ||
    isArtistDetail ||
    isSubscriptionDetail ||
    isExhibitionDetail
  ) {
    return null;
  }

  return (
    <header className="container px-5 mx-auto shrink-0 bg-background my-6 md:mb-6">
      <div className="flex w-full items-center gap-2">
        {/* --- Breadcrumbs (Above the Title, subtle text size) --- */}
        <Breadcrumb aria-label="Breadcrumb navigation">
          <BreadcrumbList className="text-xs text-muted-foreground">
            {breadcrumbItems}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* --- Main Dynamic Title (Prominent, below breadcrumbs) --- */}
      <div className="mt-2">
        <h1 className="text-3xl syncopate tracking-tight text-foreground">
          {dynamicTitle}
        </h1>
      </div>
    </header>
  );
}
