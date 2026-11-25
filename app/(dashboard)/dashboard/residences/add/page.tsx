import { redirect } from "next/navigation";
import ResidenceForm from "@/components/forms/residence-form";
import { SectionHeader } from "@/components/SectionHeader";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchListingAssignees } from "@/lib/actions/users.action";
import ROUTES from "@/constants/routes";
import { canUseAssistantOperations, isElevatedRole } from "@/constants/values";

export default async function AddResidencePage() {
  const user = await getUserBySessionEmail();
  if (!user.data || !canUseAssistantOperations(user.data.role)) {
    redirect(ROUTES.DASHBOARD);
  }

  const assistantDraft = !isElevatedRole(user.data.role);
  const assigneesResult = assistantDraft ? undefined : await fetchListingAssignees();

  return (
    <div>
      <SectionHeader
        title="Ajouter une résidence"
        subtitle="Renseignez les détails du programme immobilier"
      />
      <ResidenceForm agents={assigneesResult?.data ?? []} assistantDraft={assistantDraft} />
    </div>
  );
}
