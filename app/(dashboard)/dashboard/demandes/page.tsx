import { redirect } from "next/navigation";

import { SectionHeader } from "@/components/SectionHeader";
import {
  NegotiationRequest,
  NegotiationRequestsList,
} from "@/components/negotiations/NegotiationRequestsList";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchPendingNegotiationRequests } from "@/lib/actions/negotiation.action";
import ROUTES from "@/constants/routes";

export default async function DemandesPage() {
  const user = await getUserBySessionEmail();
  const role = user.data?.role ?? "";

  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect(ROUTES.DASHBOARD);
  }

  const result = await fetchPendingNegotiationRequests();
  const requests = result.data?.negotiations ?? [];
  const total = result.data?.total ?? 0;

  return (
    <section className="container space-y-6 py-6">
      <SectionHeader
        title="Demandes"
        subtitle="Validez ou refusez les nouvelles négociations avant leur activation"
      />

      <p className="text-sm text-muted-foreground">
        {total} demande{total > 1 ? "s" : ""} en attente
      </p>

      <NegotiationRequestsList
        requests={requests as unknown as NegotiationRequest[]}
      />
    </section>
  );
}
