"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ROUTES from "@/constants/routes";
import { CLIENT_QUALIFICATIONS } from "@/constants/values";
import { archiveClient, restoreClient } from "@/lib/actions/client.action";
import ClientEditForm from "./ClientEditForm";

const TYPE_LABELS: Record<string, string> = {
  BUYER: "Acheteur",
  SELLER: "Vendeur",
  RENTER: "Loueur",
  INVESTOR: "Investisseur",
};

const FOLLOWUP_TYPE_COLORS: Record<string, string> = {
  COLD: "bg-blue-100 text-blue-800",
  WARM: "bg-amber-100 text-amber-800",
  HOT: "bg-red-100 text-red-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-800",
  DONE: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const CHANNEL_LABELS: Record<string, string> = {
  CALL: "Appel",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  VISIT: "Visite",
};

interface ClientDetailPageProps {
  client: Client;
  followUps: FollowUp[];
  userRole?: string;
  agents?: User[];
}

export default function ClientDetailPage({
  client,
  followUps,
  userRole,
  agents = [],
}: ClientDetailPageProps) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const qualificationLabel =
    CLIENT_QUALIFICATIONS.find((q) => q.value === client.qualificationStatus)
      ?.label ?? client.qualificationStatus;

  const handleArchive = async () => {
    setIsWorking(true);
    const result = await archiveClient(client._id);
    setIsWorking(false);

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Client archivé", {
      description: `${client.firstName} ${client.lastName} a été archivé.`,
    });
    setArchiveOpen(false);
    router.push(ROUTES.CLIENTS_DASHBOARD);
  };

  const handleRestore = async () => {
    setIsWorking(true);
    const result = await restoreClient(client._id);
    setIsWorking(false);

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Client restauré", {
      description: `${client.firstName} ${client.lastName} est actif à nouveau.`,
    });
    router.refresh();
  };

  return (
    <section className="container py-6 space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.CLIENTS_DASHBOARD}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-serif">
            {client.firstName} {client.lastName}
          </h1>
          <Badge variant="outline">{client.referenceCode}</Badge>
          <Badge>{TYPE_LABELS[client.type]}</Badge>
          <Badge variant="secondary">{qualificationLabel}</Badge>
        </div>

        {client.archived ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={isWorking}
          >
            {isWorking ? "En cours…" : "Restaurer"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setArchiveOpen(true)}
          >
            Archiver ce client
          </Button>
        )}
      </div>

      {/* Archived banner */}
      {client.archived && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Ce client est actuellement archivé. Utilisez le bouton &quot;Restaurer&quot; pour
          le rendre actif.
        </div>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientEditForm client={client} userRole={userRole} agents={agents} />
        </CardContent>
      </Card>

      {/* Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Suivis associés</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun suivi associé à ce client.
            </p>
          ) : (
            <div className="space-y-3">
              {followUps.map((fu, index) => {
                const listing = fu.listing as unknown as {
                  title?: string;
                  description?: string;
                };

                return (
                  <div
                    key={fu._id ?? index}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${FOLLOWUP_TYPE_COLORS[fu.type]}`}
                        >
                          {fu.type}
                        </span>
                        {fu.channel && (
                          <span className="text-xs text-muted-foreground">
                            {CHANNEL_LABELS[fu.channel]}
                          </span>
                        )}
                      </div>

                      {fu.title && (
                        <p className="text-sm font-medium">{fu.title}</p>
                      )}
                      {fu.note && (
                        <p className="text-sm text-muted-foreground">
                          {fu.note}
                        </p>
                      )}
                      {listing && (
                        <p className="text-xs text-muted-foreground">
                          Annonce :{" "}
                          {listing.title ||
                            listing.description?.slice(0, 60) ||
                            "—"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${FOLLOWUP_STATUS_COLORS[fu.status || "PENDING"]}`}
                      >
                        {fu.status || "PENDING"}
                      </span>
                      {fu.reminderAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(fu.reminderAt), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archiver le client</DialogTitle>
            <DialogDescription>
              Cette action archivera{" "}
              <strong>
                {client.firstName} {client.lastName}
              </strong>
              . Le client ne sera plus visible dans la liste active mais restera
              dans le système.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isWorking}
            >
              {isWorking ? "En cours…" : "Archiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
