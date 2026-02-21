import { fetchClients } from "@/lib/actions/client.action";
import { fetchListings } from "@/lib/actions/listings.action";
import MatchingView from "@/components/matching/MatchingView";
import { SectionHeader } from "@/components/SectionHeader";

export default async function MatchingPage() {
  const [clientsResult, listingsResult] = await Promise.all([
    fetchClients({ limit: 100 }),
    fetchListings({ limit: 100 }),
  ]);

  const allClients = clientsResult.success
    ? (clientsResult.data?.clients ?? [])
    : [];
  const allListings = listingsResult.success ? (listingsResult.data ?? []) : [];

  // Only buyers and renters have meaningful matching
  const matchableClients = allClients.filter(
    (c) => c.type === "BUYER" || c.type === "RENTER"
  );

  // Only active listings can be matched
  const activeListings = allListings.filter(
    (l) => l.status === "En Vente" || l.status === "En Location"
  );

  return (
    <section className="container py-6">
      <div className="mb-6">
        <SectionHeader
          title="Matching"
          subtitle="Visualisez les correspondances entre clients et annonces."
        />
      </div>
      <MatchingView clients={matchableClients} listings={activeListings} />
    </section>
  );
}
