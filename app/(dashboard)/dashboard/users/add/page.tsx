import { redirect } from "next/navigation";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { SectionHeader } from "@/components/SectionHeader";
import UserForm from "@/components/users/UserForm";
import ROUTES from "@/constants/routes";

export default async function AddUserPage() {
  const user = await getUserBySessionEmail();
  const role = user.data?.role || "";
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "DEVELOPER";

  if (!isAdmin) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <main className="space-y-6">
      <SectionHeader
        title="Ajouter un Utilisateur"
        subtitle="Créez un nouveau membre de l'équipe"
      />
      <UserForm mode="create" />
    </main>
  );
}
