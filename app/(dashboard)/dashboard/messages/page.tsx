import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MessagesClient from "@/components/dashboard/MessagesClient";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { hasPermission } from "@/lib/roleCheck";
import { redirect } from "next/navigation";

function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

async function MessagesContent() {
  const user = await getUserBySessionEmail();
  const isAuthorized = hasPermission(
    user.data?.role || "",
    "view_all_messages"
  );

  if (!isAuthorized) {
    redirect("/dashboard");
  }

  return <MessagesClient />;
}

export default function MessagesPage() {
  return (
    <main>
      <Suspense fallback={<MessagesSkeleton />}>
        <MessagesContent />
      </Suspense>
    </main>
  );
}
