"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Calendar, CheckCircle2, XCircle, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GoogleCalendarConnect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "calendar_connected") {
      toast.success("Google Calendar connecté avec succès !");
      setIsConnected(true);
      // Clean URL
      router.replace("/dashboard/schedule");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: "Connexion refusée par l'utilisateur",
        missing_params: "Paramètres manquants",
        no_token: "Impossible d'obtenir le token",
        callback_failed: "Erreur lors de la connexion",
      };
      toast.error(errorMessages[error] || "Erreur de connexion");
      router.replace("/dashboard/schedule");
    }
  }, [searchParams, router]);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/calendar/google/status");
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error("Error checking status:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/calendar/google/connect";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/calendar/google/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Google Calendar déconnecté");
        setIsConnected(false);
      } else {
        toast.error("Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Vérification de la connexion...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isConnected
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Google Calendar</p>
              <div className="flex items-center gap-1.5 text-xs">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Connecté</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Non connecté</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isConnected ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDisconnecting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Déconnecter"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Déconnecter Google Calendar ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Les événements ne seront plus synchronisés avec votre Google
                    Calendar. Vous pourrez vous reconnecter à tout moment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnect}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Déconnecter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button size="sm" onClick={handleConnect}>
              <Link2 className="h-4 w-4 mr-2" />
              Connecter
            </Button>
          )}
        </div>

        {!isConnected && (
          <p className="mt-3 text-xs text-muted-foreground">
            Connectez Google Calendar pour synchroniser automatiquement vos
            événements, suivis et tâches.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
