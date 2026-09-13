import { notFound, redirect } from "next/navigation";
import ResidenceForm from "@/components/forms/residence-form";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchResidenceById } from "@/lib/actions/residence.action";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchListingAssignees } from "@/lib/actions/users.action";
import ROUTES from "@/constants/routes";
import { isElevatedRole } from "@/constants/values";

export default async function EditResidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserBySessionEmail();
  if (!user.data || !isElevatedRole(user.data.role)) {
    redirect(ROUTES.DASHBOARD);
  }

  const { id } = await params;
  const [result, assigneesResult] = await Promise.all([
    fetchResidenceById(id),
    fetchListingAssignees(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const residence = result.data;

  return (
    <div>
      <SectionHeader
        title="Modifier la résidence"
        subtitle={`Référence : ${residence.referenceCode}`}
      />
      <ResidenceForm
        initialData={residence}
        residenceId={id}
        agents={assigneesResult.data ?? []}
      />
    </div>
  );
}
