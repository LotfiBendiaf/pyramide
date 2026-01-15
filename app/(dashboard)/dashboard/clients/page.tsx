import { Suspense } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchClients } from "@/lib/actions/client.action";
import { ListingsSkeleton } from "@/components/skeletons/ListingsSkeleton";
import ClientsTable from "@/components/ClientsTable";

async function ClientsContent() {
  const result = await fetchClients();

  if (!result.success) {
    return (
      <div className="text-center text-red-500 py-20">
        Impossible de charger les clients.
      </div>
    );
  }

  const clients = result.data?.clients;

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Aucun client trouvé.
      </div>
    );
  }

  return <ClientsTable clients={clients} />;
}

export default function ClientPage() {
  return (
    <section className="container py-6 space-y-6">
      <SectionHeader
        title="Clients"
        subtitle="Gérez et qualifiez vos clients"
      />

      <Suspense fallback={<ListingsSkeleton />}>
        <ClientsContent />
      </Suspense>
    </section>
  );
}
