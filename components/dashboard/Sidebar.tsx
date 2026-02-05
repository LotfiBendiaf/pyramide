"use client";

import { usePathname } from "next/navigation";

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
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSession } from "next-auth/react";
import Logo from "../Logo";
import LogoutButton from "../LogoutButton";
import { Separator } from "../ui/separator";
import Link from "next/link";
import {
  User2,
  ChevronUp,
  UserCircle,
  PlusCircle,
  Home,
  Users,
  ListCheck,
  UserPlus,
  CalendarArrowUp,
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  UsersRound,
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
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url}>
                            <item.icon className="w-4 h-4" />
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                className="shadow-2xl border p-3 rounded-xl h-full"
              >
                <SidebarMenuButton className="cursor-pointer flex items-center h-auto">
                  <div className="p-1 border bg-gray-200 rounded-lg shrink-0">
                    <User2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs overflow-hidden flex flex-col ml-2 text-left">
                    <span className="font-medium truncate">
                      {status === "loading" ? "Chargement..." : user?.name}
                    </span>
                    {user?.role && (
                      <span className="text-muted-foreground text-[10px] truncate">
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                      </span>
                    )}
                  </div>
                  <ChevronUp className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" className="w-56" align="start">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="h-4 w-4" />
                  <span>Compte</span>
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem asChild>
                  {/* Ensure LogoutButton handles its own styling/clicks */}
                  <div className="w-full cursor-pointer">
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
