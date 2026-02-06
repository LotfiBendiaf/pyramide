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
import {
  ChevronUp,
  Settings,
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
    ],
  },
  {
    label: "Suivis",
    items: [
      {
        title: "Tous les suivis",
        url: ROUTES.FOLLOWUPS,
        icon: ClipboardList,
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
    roles: ["ADMIN", "MANAGER"],
    items: [
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
  return allowedRoles.includes(userRole);
}

export function AppSidebar() {
  const { data, status } = useSession();
  const user = data?.user;
  const userRole = user?.role as Role | undefined;
  const pathname = usePathname();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    setLoadingUrl(null);
  }, [pathname]);

  const handleNavClick = (url: string) => {
    // Only show loading if navigating to a different page
    if (url !== pathname) {
      setLoadingUrl(url);
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
                  className="cursor-pointer w-full bg-gradient-to-r from-sidebar-accent to-sidebar-accent/50 hover:from-sidebar-accent/80 hover:to-sidebar-accent/30 border border-sidebar-border rounded-xl p-3 transition-all duration-200 hover:shadow-md"
                >
                  <Avatar className="h-9 w-9 rounded-lg border-2 border-primary/20 shadow-sm">
                    <AvatarImage
                      src={user?.image || ""}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 text-left text-sm leading-tight ml-2 overflow-hidden">
                    <span className="font-semibold truncate">
                      {status === "loading" ? "Chargement..." : user?.name}
                    </span>
                    {user?.role && (
                      <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3 text-primary" />
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                      </span>
                    )}
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 text-left">
                    <Avatar className="h-10 w-10 rounded-lg border-2 border-primary/20">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || ""}
                      />
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg mx-1">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="mx-auto">
                    <LogoutButton />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
