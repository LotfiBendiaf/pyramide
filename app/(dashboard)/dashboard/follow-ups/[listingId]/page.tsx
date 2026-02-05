import { FollowUpTimeline } from "@/components/followUp/FollowUpTimeline";
import { SectionHeader } from "@/components/SectionHeader";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { fetchFollowUpsByListing } from "@/lib/actions/followUp.action";
import { Suspense } from "react";

export default async function FOLLOWUPS({
  params,
}: {
  params: { listingId: string };
}) {
  const { listingId } = await params;
  const response = await fetchFollowUpsByListing(listingId!);
  if (!response.success || !response.data || response.data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        Aucun suivi disponible pour cette annonce.
      </div>
    );
  }
  const followUps = response.data;
  return (
    <section className="space-y-10">
      <SectionHeader title="Les suivies Clients" />

      <Suspense fallback={<TableSkeleton />}>
        <FollowUpTimeline followUps={followUps} />
      </Suspense>
    </section>
  );
}
