import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { fetchTeamMembers } from "@/lib/actions/users.action";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/SectionHeader";
import UsersTable from "@/components/users/UsersTable";
import ROUTES from "@/constants/routes";
import { UserPlus } from "lucide-react";

async function getUsersData() {
  const user = await getUserBySessionEmail();
  const role = user.data?.role || "";
  const isAdmin = role === "ADMIN" || role === "MANAGER";

  if (!isAdmin) {
    redirect(ROUTES.DASHBOARD);
  }

  const usersResult = await fetchTeamMembers();

  return {
    users: usersResult.success ? usersResult.data || [] : [],
    currentUserId: user.data?._id,
    currentUserRole: role,
  };
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function UsersContent() {
  const { users, currentUserId, currentUserRole } = await getUsersData();

  return (
    <UsersTable
      users={users}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  );
}

export default function UsersPage() {
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Gestion des Utilisateurs"
          subtitle="Gérez les membres de votre équipe"
        />
        <Button asChild>
          <Link href={ROUTES.USER_ADD}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Link>
        </Button>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersContent />
      </Suspense>
    </main>
  );
}
