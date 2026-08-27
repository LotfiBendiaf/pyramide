"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSession } from "next-auth/react";
import Logo from "../Logo";
import LogoutButton from "../LogoutButton";
import Link from "next/link";
import ChangePasswordDialog from "../forms/change-password-form";
import {
  ChevronUp,
  PlusCircle,
  Users,
  UserPlus,
  CalendarArrowUp,
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  UsersRound,
  BadgeCheck,
  UserCog,
  CalendarDays,
  Loader2,
  Mail,
  Shuffle,
  CalendarCheck,
  Handshake,
  BriefcaseBusiness,
  ClipboardCheck,
  Lock,
  Star,
} from "lucide-react";
import { Role, ROLE_LABELS } from "@/constants/values";
import ROUTES from "@/constants/routes";

type SidebarItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
};

type SidebarGroup = {
  label: string;
  roles?: Role[];
  items: SidebarItem[];
};

const sidebarConfig: SidebarGroup[] = [
  {
    label: "Menu Principal",
    items: [
      {
        title: "Tableau de bord",
        url: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Mon planning",
        url: ROUTES.SCHEDULE,
        icon: CalendarDays,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
    ],
  },
  {
    label: "Biens Immobiliers",
    items: [
      {
        title: "Liste des biens",
        url: ROUTES.LISTINGS_DASHBOARD,
        icon: Building2,
      },
      {
        title: "Ajouter un bien",
        url: ROUTES.LISTING_ADD,
        icon: PlusCircle,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
      {
        title: "Biens à la une",
        url: ROUTES.FEATURED_LISTINGS_DASHBOARD,
        icon: Star,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Gestion Clients",
    items: [
      {
        title: "Tous les clients",
        url: ROUTES.CLIENTS_DASHBOARD,
        icon: Users,
      },
      {
        title: "Ajouter un client",
        url: ROUTES.CLIENT_ADD,
        icon: UserPlus,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
      {
        title: "Matching",
        url: ROUTES.MATCHING,
        icon: Shuffle,
      },
    ],
  },
  {
    label: "Suivis / Visites",
    items: [
      {
        title: "Suivis",
        url: ROUTES.FOLLOWUPS,
        icon: ClipboardList,
      },
      {
        title: "Visites",
        url: ROUTES.VISITS,
        icon: CalendarCheck,
      },
      {
        title: "Nouveau suivi",
        url: ROUTES.NEW_FOLLOWUP,
        icon: CalendarArrowUp,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
    ],
  },
  {
    label: "Pipeline",
    items: [
      {
        title: "Mes biens",
        url: ROUTES.MES_BIENS,
        icon: BriefcaseBusiness,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
      {
        title: "Négociations",
        url: ROUTES.NEGOTIATIONS,
        icon: Handshake,
      },
      {
        title: "Demandes",
        url: ROUTES.DEMANDES,
        icon: ClipboardCheck,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Documents",
    items: [
      {
        title: "Générer un document",
        url: ROUTES.DOCUMENTS,
        icon: FileText,
        roles: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"],
      },
    ],
  },
  {
    label: "Rapports",
    items: [
      {
        title: "Mon rapport quotidien",
        url: ROUTES.DAILY_REPORT,
        icon: FileText,
        roles: ["ADMIN", "MANAGER", "AGENT"],
      },
      {
        title: "Rapport d'équipe",
        url: ROUTES.TEAM_REPORT,
        icon: UsersRound,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Administration",
    roles: ["ADMIN", "MANAGER", "ASSISTANT"],
    items: [
      {
        title: "Messages",
        url: ROUTES.MESSAGES,
        icon: Mail,
        roles: ["ADMIN", "MANAGER", "ASSISTANT"],
      },
      {
        title: "Gestion utilisateurs",
        url: ROUTES.USERS,
        icon: UserCog,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Ajouter un utilisateur",
        url: ROUTES.USER_ADD,
        icon: UserPlus,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
];

function canAccess(userRole: Role | undefined, allowedRoles?: Role[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  if (userRole === "DEVELOPER") return true;
  return allowedRoles.includes(userRole);
}

export function AppSidebar() {
  const { data, status } = useSession();
  const user = data?.user;
  const userRole = user?.role as Role | undefined;
  const pathname = usePathname();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    setLoadingUrl(null);
  }, [pathname]);

  const handleNavClick = (url: string) => {
    if (url !== pathname) {
      setLoadingUrl(url);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {sidebarConfig.map((group) => {
          // Filter items based on user role
          const visibleItems = group.items.filter((item) =>
            canAccess(userRole, item.roles)
          );

          // Skip rendering group if no items are visible
          if (visibleItems.length === 0) return null;

          // Skip rendering group if group-level role check fails
          if (!canAccess(userRole, group.roles)) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      (item.url !== ROUTES.DASHBOARD &&
                        pathname.startsWith(item.url));
                    const isLoading = loadingUrl === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link
                            href={item.url}
                            onClick={() => handleNavClick(item.url)}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <item.icon className="w-4 h-4" />
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="group h-auto min-h-16 w-full cursor-pointer rounded-xl border border-sidebar-border/80 bg-sidebar-accent/60 p-2.5 shadow-sm transition-all duration-200 hover:border-primary/25 hover:bg-sidebar-accent hover:shadow-md data-[state=open]:border-primary/30 data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-10 w-10 rounded-xl border border-primary/20 bg-background shadow-sm ring-2 ring-background">
                    <AvatarImage
                      src={user?.image || ""}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2 flex min-w-0 flex-1 flex-col gap-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold text-sidebar-foreground">
                      {status === "loading" ? "Chargement..." : user?.name}
                    </span>
                    {user?.role && (
                      <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-1 py-0.5 text-[11px] font-medium text-primary">
                        <BadgeCheck className="h-3 w-3 shrink-0" />
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                      </span>
                    )}
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:text-sidebar-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-1.5"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-3 text-left">
                    <Avatar className="h-11 w-11 rounded-xl border border-primary/20 bg-background shadow-sm">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || ""}
                      />
                      <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-semibold">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {user?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-1 py-0.5 text-[11px] font-medium text-primary">
                          <BadgeCheck className="h-3 w-3" />
                          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg mx-1"
                  onSelect={(event) => {
                    event.preventDefault();
                    setIsChangePasswordOpen(true);
                  }}
                >
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Changer le mot de passe</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-1 py-1">
                  <LogoutButton
                    variant="ghost"
                    className="h-9 w-full justify-start rounded-lg px-3 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChangePasswordDialog
              open={isChangePasswordOpen}
              onOpenChange={setIsChangePasswordOpen}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
