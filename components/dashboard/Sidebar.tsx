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
  Award,
  Briefcase,
  Building,
  DollarSign,
  FileText,
  Home,
  KeyRound,
  List,
  MonitorCog,
  Settings,
  Users,
  ListCheck,
  UserPlus,
} from "lucide-react";
import { ROLE_LABELS } from "@/constants/values";
import ROUTES from "@/constants/routes";

const sidebarConfig = [
  {
    label: "Menu Principal",
    roles: ["admin"],
    items: [{ title: "Tableau de bord", url: ROUTES.DASHBOARD, icon: Home }], // Assuming '/dashboard' and an 'Home' icon component
  },
  {
    label: "Propriétés",
    roles: ["admin", "agent", "assistant"],
    items: [
      {
        title: "Toutes les Annonces",
        url: ROUTES.LISTINGS_DASHBOARD,
        icon: ListCheck,
      }, // List of all properties for sale/rent
      {
        title: "Ajouter une Propriété",
        url: ROUTES.LISTING_ADD,
        icon: PlusCircle,
      },
      {
        title: "Ventes et Transactions",
        url: "/transactions/sales",
        icon: DollarSign,
      }, // Sales pipeline/completed sales
      { title: "Locations", url: "/transactions/rentals", icon: KeyRound }, // Rental properties and leases
    ],
  },
  {
    label: "Clients & Demandes",
    items: [
      {
        title: "Clients Acquéreurs",
        url: ROUTES.CLIENTS_DASHBOARD,
        icon: Users,
      }, // General clients/buyers
      {
        title: "Ajouter un Client",
        url: ROUTES.CLIENT_ADD,
        icon: UserPlus,
      }, // General clients/buyers
      { title: "Liste d'Attente", url: "/clients/waiting-list", icon: List }, // Waiting list for specific property types
      { title: "Propriétaires", url: "/clients/owners", icon: Building }, // Sellers/Landlords
      { title: "Contrats & Mandats", url: "/contracts", icon: FileText }, // Management of contracts (mandats)
    ],
  },
  {
    label: "Ressources Humaines",
    items: [
      { title: "Agents Immobiliers", url: "/agents", icon: Briefcase }, // Real Estate Agents list
      { title: "Commissions", url: "/agents/commissions", icon: Award },
    ],
  },
  {
    label: "Système",
    items: [
      { title: "Paramètres", url: "/settings", icon: Settings },
      { title: "Utilisateurs & Accès", url: "/users", icon: MonitorCog },
    ],
  },
];

export function AppSidebar() {
  const { data, status } = useSession();
  const user = data?.user;
  const pathname = usePathname(); // ✅ get current route

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {sidebarConfig.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={`flex items-center gap-2 px-2 py-1 ${
                            isActive
                              ? "bg-primary text-white" // ✅ active style
                              : ""
                          }`}
                        >
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
        ))}
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
                        {ROLE_LABELS[user.role[0] as keyof typeof ROLE_LABELS]}
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
