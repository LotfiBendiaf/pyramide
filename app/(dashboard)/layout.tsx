import { SiteHeader } from "@/components/dashboard/Header";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import React, { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Pyramide - Tableau de bord";

  return {
    title,
    description:
      "Pyramide Immo - Tableau de bord pour la gestion de la plateforme.",
  };
}

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full overflow-hidden">
        <header>
          <SiteHeader />
        </header>
        <div className="w-full p-5">{children}</div>
      </main>
    </SidebarProvider>
  );
};

export default layout;
