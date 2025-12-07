"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";
import { Button } from "./ui/button";

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
    <Button variant={"secondary"} onClick={handleLogout}>
      <LogOut className="size-4" />
      <span>Déconnexion</span>
    </Button>
  );
};

export default LogoutButton;
