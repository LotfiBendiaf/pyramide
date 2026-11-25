import { AssistantWorkspace } from "@/components/dashboard/AssistantContext";
import { FloatingAssistant } from "@/components/dashboard/AssistantWorkspace";
import { SiteHeader } from "@/components/dashboard/Header";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { BreadcrumbTitleProvider } from "@/components/navigation/BreadcrumbTitleContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import React, { ReactNode } from "react";
import { canUseAssistant } from "@/lib/assistant-access";
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
  const role = user.data?.role;
  const hasAssistant = canUseAssistant(role);
  const dashboard = (
    <SidebarProvider>
      <BreadcrumbTitleProvider>
        <AppSidebar
          effectiveRole={user.data?.role}
          accountRole={user.data?.accountRole}
          activeProfile={user.data?.activeProfile}
        />
        <main className="min-w-0 flex-1 overflow-x-clip lg:has-[.assistant-dashboard]:flex lg:has-[.assistant-dashboard]:h-dvh lg:has-[.assistant-dashboard]:flex-col">
          <header className="shrink-0">
            <SiteHeader />
          </header>
          <div className="w-full bg-[#fcfbf9] p-4 sm:p-6 lg:p-8 dark:bg-background lg:has-[.assistant-dashboard]:min-h-0 lg:has-[.assistant-dashboard]:flex-1">{children}</div>
        </main>
        {hasAssistant && <FloatingAssistant />}
      </BreadcrumbTitleProvider>
    </SidebarProvider>
  );
  return hasAssistant ? <AssistantWorkspace key={`${user.data?._id}:${role}`} role={role}>{dashboard}</AssistantWorkspace> : dashboard;
};

export default layout;
