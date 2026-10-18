import { SiteHeader } from "@/components/dashboard/Header";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { BreadcrumbTitleProvider } from "@/components/navigation/BreadcrumbTitleContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import React, { ReactNode } from "react";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Pyramide - Tableau de bord";

  return {
    title,
    description:
      "Pyramide Immo - Tableau de bord pour la gestion de la plateforme.",
  };
}

const layout = async ({ children }: { children: ReactNode }) => {
  const user = await getUserBySessionEmail();
  return (
    <SidebarProvider>
      <BreadcrumbTitleProvider>
        <AppSidebar
          effectiveRole={user.data?.role}
          accountRole={user.data?.accountRole}
          activeProfile={user.data?.activeProfile}
        />
        <main className="w-full overflow-hidden">
          <header>
            <SiteHeader />
          </header>
          <div className="w-full p-5">{children}</div>
        </main>
      </BreadcrumbTitleProvider>
    </SidebarProvider>
  );
};

export default layout;
