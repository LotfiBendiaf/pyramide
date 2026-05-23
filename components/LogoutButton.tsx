"use client";
import type * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";
import { Button } from "./ui/button";

type LogoutButtonProps = React.ComponentProps<typeof Button>;

const LogoutButton = ({
  className,
  variant = "secondary",
  ...props
}: LogoutButtonProps) => {
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
    <Button
      variant={variant}
      className={className}
      {...props}
      onClick={handleLogout}
    >
      <LogOut className="size-4" />
      <span>Déconnexion</span>
    </Button>
  );
};

export default LogoutButton;
