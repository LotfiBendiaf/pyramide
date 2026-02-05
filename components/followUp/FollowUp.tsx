import { fetchFollowUpsByListing } from "@/lib/actions/followUp.action";
import { Suspense } from "react";
import { SectionHeader } from "../SectionHeader";
import { TableSkeleton } from "../skeletons/TableSkeleton";
import { FollowUpTimeline } from "./FollowUpTimeline";

export async function FollowUp({ listingId }: { listingId: string }) {
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
      <SectionHeader title="Suivis de cette annonce" />

      <Suspense fallback={<TableSkeleton />}>
        <FollowUpTimeline followUps={followUps} />
      </Suspense>
    </section>
  );
}
