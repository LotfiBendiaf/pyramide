"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";

const LogoutButton = () => {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut({ redirect: false }); // prevent redirect
    toast.success("Déconnexion réussie", {
      icon: <LogOut className="text-green-500" />,
      duration: 3000,
    });
    router.push(ROUTES.HOME);
  };

  return (
    <div className="z-20 w-full flex items-center gap-2" onClick={handleLogout}>
      <LogOut />
      <span>Déconnexion</span>
    </div>
  );
};

export default LogoutButton;
