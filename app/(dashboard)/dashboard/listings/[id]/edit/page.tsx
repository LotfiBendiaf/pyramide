import ListingForm from "@/components/forms/listing-form";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchClientById } from "@/lib/actions/client.action";
import { fetchListingById } from "@/lib/actions/listings.action";
import { notFound } from "next/navigation";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const result = await fetchListingById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const listing = result.data;
  const clientId = listing.sellerClient._id;

  const clientResult = await fetchClientById(clientId);

  return (
    <div>
      <SectionHeader
        title="Modifier le bien"
        subtitle={`Référence : ${listing.referenceCode}`}
      />
      <ListingForm
        initialData={listing}
        listingId={id}
        client={clientResult.data}
      />
    </div>
  );
}
