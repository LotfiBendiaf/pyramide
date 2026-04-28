import { notFound } from "next/navigation";
import { fetchNegotiationById } from "@/lib/actions/negotiation.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { isElevatedRole } from "@/constants/values";
import { SectionHeader } from "@/components/SectionHeader";
import {
  NegotiationDetail,
  NegotiationDetailProps,
} from "@/components/negotiations/NegotiationDetail";

export default async function NegotiationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, user] = await Promise.all([
    fetchNegotiationById(id),
    getUserBySessionEmail(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const negotiation = result.data as unknown as NegotiationDetailProps["negotiation"];
  const currentUserId = user.data?._id?.toString() ?? "";
  const isManager = isElevatedRole(user.data?.role ?? "");

  return (
    <section className="container py-6 max-w-3xl">
      <SectionHeader
        title="Négociation"
        subtitle={
          negotiation.listing?.referenceCode
            ? `Bien ${negotiation.listing.referenceCode}`
            : "Détail de la négociation"
        }
      />
      <div className="mt-6">
        <NegotiationDetail
          negotiation={negotiation}
          currentUserId={currentUserId}
          isManager={isManager}
        />
      </div>
    </section>
  );
}
