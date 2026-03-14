import { fetchClientById } from "@/lib/actions/client.action";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { fetchListingsBySellerClient } from "@/lib/actions/listings.action";
import { notFound } from "next/navigation";
import ClientDetailPage from "@/components/clients/ClientDetailPage";
import ClientMatchingPanel from "@/components/clients/ClientMatchingPanel";
import { ListingTable } from "@/components/listing/ListingTable";

export default async function ClientDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const [clientResult, followUpsResult] = await Promise.all([
    fetchClientById(id),
    fetchFollowUpsByClient(id),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;

  const sellerListingsResult =
    client.type === "SELLER" ? await fetchListingsBySellerClient(id) : null;

  return (
    <>
      <ClientDetailPage
        client={client}
        followUps={followUpsResult.data ?? []}
      />
      {(client.type === "BUYER" || client.type === "RENTER") && (
        <div className="container pb-10">
          <ClientMatchingPanel client={client} />
        </div>
      )}
      {client.type === "SELLER" && sellerListingsResult?.success && (
        <div className="container pb-10">
          <ListingTable listings={sellerListingsResult.data ?? []} />
        </div>
      )}
    </>
  );
}
