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
} from "lucide-react";
import Listings from "../Listings";

const sidebarConfig = [
  {
    label: "Menu Principal",
    items: [{ title: "Tableau de bord", url: "/dashboard", icon: Home }], // Assuming '/dashboard' and an 'Home' icon component
  },
  {
    label: "Propriétés",
    items: [
      { title: "Toutes les Annonces", url: "/listings", icon: ListCheck }, // List of all properties for sale/rent
      {
        title: "Ajouter une Propriété",
        url: "/listings/add",
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
      { title: "Clients Acquéreurs", url: "/clients/buyers", icon: Users }, // General clients/buyers
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
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="cursor-pointer flex items-center">
                  <div className="p-1 border bg-gray-200 rounded-lg">
                    <User2 />
                  </div>
                  <div className="text-xs">
                    {status === "loading" ? "Chargement..." : user?.name}
                    {user?.role && (
                      <p className="text-muted-foreground text-xs">
                        {user.role}
                      </p>
                    )}
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem className="flex items-center">
                  <UserCircle className=" h-4 w-4" />
                  <span>Compte</span>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
