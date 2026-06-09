import ListingGallery from "@/components/listing/ListingGallery";
import ListingInfo from "@/components/listing/ListingInfo";
import ListingSidebar from "@/components/listing/ListingSidebar";
import ListingMatchingPanel from "@/components/listing/ListingMatchingPanel";
import { fetchListingById } from "@/lib/actions/listings.action";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import ROUTES from "@/constants/routes";
import { DeleteListingButton } from "@/components/listing/DeleteListingButton";
import { CopyClientListingLinkButton } from "@/components/listing/CopyClientListingLinkButton";
import { SetBreadcrumbTitle } from "@/components/navigation/BreadcrumbTitleContext";

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
    <section className="container">
      <SetBreadcrumbTitle
        title={listing.referenceCode ?? listing.title ?? "Annonce"}
      />
      {/* Gallery - Staff can see all images */}
      <ListingGallery images={listing.images} isStaff={true} />

      <div className="flex justify-end gap-2 mt-4">
        <CopyClientListingLinkButton listingId={id} />
        <Button asChild variant="outline">
          <Link href={ROUTES.LISTING_EDIT(id)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </Button>
        <DeleteListingButton listingId={id} />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Main content */}
        <ListingInfo listing={listing} isStaff={true} />

        {/* Sidebar */}
        <ListingSidebar listing={listing} isStaff={true} />
      </div>

      {/* Matching clients */}
      <div className="mt-10">
        <ListingMatchingPanel listing={listing} />
      </div>
    </section>
  );
}
