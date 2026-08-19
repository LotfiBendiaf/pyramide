"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "clients", label: "Suivis clients", icon: Users },
  { value: "listings", label: "Suivis annonces", icon: Building2 },
] as const;

export function FollowUpsTabs({
  active,
}: {
  active: "clients" | "listings";
}) {
  const pathname = usePathname();

  return (
    <div className="inline-flex w-full gap-1 rounded-lg border bg-muted/40 p-1 sm:w-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "clients" ? pathname : `${pathname}?tab=listings`}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
            active === tab.value
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <tab.icon className="size-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
