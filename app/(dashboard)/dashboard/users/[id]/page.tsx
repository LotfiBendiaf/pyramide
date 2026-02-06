import { redirect, notFound } from "next/navigation";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchUserById } from "@/lib/actions/users.action";
import { SectionHeader } from "@/components/SectionHeader";
import UserForm from "@/components/users/UserForm";
import ROUTES from "@/constants/routes";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const currentUser = await getUserBySessionEmail();
  const role = currentUser.data?.role || "";
  const isAdmin = role === "ADMIN" || role === "MANAGER";

  if (!isAdmin) {
    redirect(ROUTES.DASHBOARD);
  }

  const userResult = await fetchUserById(id);

  if (!userResult.success || !userResult.data) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <SectionHeader
        title="Modifier l'Utilisateur"
        subtitle={`${userResult.data.firstname} ${userResult.data.lastname}`}
      />
      <UserForm user={userResult.data} mode="edit" />
    </main>
  );
}
