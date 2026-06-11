import ListingGallery from "@/components/listing/ListingGallery";
import ListingInfo from "@/components/listing/ListingInfo";
import ListingSidebar from "@/components/listing/ListingSidebar";
import ListingMatchingPanel from "@/components/listing/ListingMatchingPanel";
import { fetchListingById } from "@/lib/actions/listings.action";
import { fetchListingDealDone } from "@/lib/actions/negotiation.action";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Pencil, UserRound } from "lucide-react";
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
  const dealDoneResult = await fetchListingDealDone(id);
  const dealDone = dealDoneResult.success ? dealDoneResult.data : null;
  const dealDoneClientName = dealDone?.client
    ? [dealDone.client.firstName, dealDone.client.lastName]
        .filter(Boolean)
        .join(" ") ||
      dealDone.client.phone ||
      "Client"
    : "Client";
  const dealDoneHref = `${ROUTES.DEAL_DONE_NEGOTIATIONS}&listingId=${id}`;

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

      {dealDone && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-950 shadow-sm dark:border-green-900/50 dark:bg-green-950/25 dark:text-green-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Deal done
                </Badge>
                <span className="text-sm font-medium">
                  Ce bien est explicitement marqué comme conclu.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">
                    {dealDoneClientName}
                  </span>
                </span>
                {dealDone.client?.referenceCode && (
                  <span className="font-mono text-xs text-green-800 dark:text-green-200">
                    {dealDone.client.referenceCode}
                  </span>
                )}
                {dealDone.closingDetails?.finalPrice !== undefined && (
                  <span className="text-green-800 dark:text-green-200">
                    {dealDone.closingDetails.finalPrice.toLocaleString("fr-DZ")}{" "}
                    DZD
                  </span>
                )}
              </div>
            </div>

            <Button asChild variant="outline" className="bg-background">
              <Link href={dealDoneHref}>
                Voir deals done
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

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
