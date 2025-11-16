"use client";

import { usePathname } from "next/navigation";
import {
  AppWindow,
  Archive,
  ArchiveRestore,
  Building2,
  Calendar,
  ChevronUp,
  Home,
  Landmark,
  List,
  MonitorCog,
  PlusCircle,
  User2,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";

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
import ROUTES from "@/constants/routes";
import Link from "next/link";

const sidebarConfig = [
  {
    label: "Tableau de bord",
    items: [{ title: "Menu Principal", url: ROUTES.DASHBOARD, icon: Home }],
  },
  {
    label: "Cheques",
    items: [
      { title: "Cheques", url: ROUTES.CHECKS, icon: AppWindow },
      { title: "Ajouter un cheque", url: "/cheques/add", icon: PlusCircle },
    ],
  },
  {
    label: "Clients",
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Ajouter un client", url: "/clients/add", icon: UserPlus },
      { title: "Liste d'attente", url: "/clients/waiting", icon: List },
      { title: "Banques", url: "/banques", icon: Landmark },
    ],
  },
  {
    label: "Fournisseurs",
    items: [
      { title: "Fournisseurs", url: "/fournisseurs", icon: Home },
      {
        title: "Ajouter un fournisseur",
        url: "/fournisseurs/add",
        icon: Calendar,
      },
      { title: "Entreprise", url: "/entreprise", icon: Building2 },
    ],
  },
  {
    label: "Archives",
    items: [
      { title: "Archives", url: "/archives", icon: Archive },
      {
        title: "Ajouter une archive",
        url: "/archives/add",
        icon: ArchiveRestore,
      },
    ],
  },
  {
    label: "Système",
    items: [{ title: "Audit", url: "/audit", icon: MonitorCog }],
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
