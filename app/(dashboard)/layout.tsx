import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
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
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full overflow-hidden">
          <div className="w-full p-5">{children}</div>
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
};

export default layout;
