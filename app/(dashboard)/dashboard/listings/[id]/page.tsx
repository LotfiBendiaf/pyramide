import ListingGallery from "@/components/listing/ListingGallery";
import ListingInfo from "@/components/listing/ListingInfo";
import ListingSidebar from "@/components/listing/ListingSidebar";
import { fetchListingById } from "@/lib/actions/listings.action";
import { notFound } from "next/navigation";

export default async function ListingDetailsPage({
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

  return (
    <section className="container py-10">
      {/* Gallery */}
      <ListingGallery images={listing.images} />

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Main content */}
        <ListingInfo listing={listing} />

        {/* Sidebar */}
        <ListingSidebar listing={listing} />
      </div>
    </section>
  );
}
