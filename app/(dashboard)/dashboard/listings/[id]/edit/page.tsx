import ListingForm from "@/components/forms/listing-form";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { fetchClientById } from "@/lib/actions/client.action";
import { fetchListingById } from "@/lib/actions/listings.action";
import { fetchListingDealDone } from "@/lib/actions/negotiation.action";
import { ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import Link from "next/link";
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

  const [clientResult, dealDoneResult] = await Promise.all([
    fetchClientById(clientId),
    fetchListingDealDone(id),
  ]);
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
    <div>
      <SectionHeader
        title="Modifier le bien"
        subtitle={`Référence : ${listing.referenceCode}`}
      />

      {dealDone && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-950 shadow-sm dark:border-green-900/50 dark:bg-green-950/25 dark:text-green-50">
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

      <ListingForm
        initialData={listing}
        listingId={id}
        client={clientResult.data}
      />
    </div>
  );
}
