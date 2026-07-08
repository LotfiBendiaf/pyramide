"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cancelClientArchiveRequest } from "@/lib/actions/archiveRequest.action";
import type { ClientDealDoneSummary } from "@/lib/actions/negotiation.action";
import { SetBreadcrumbTitle } from "@/components/navigation/BreadcrumbTitleContext";
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
  CANCELLED: "bg-red-100 text-red-800",
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
  dealDone?: ClientDealDoneSummary | null;
}

export default function ClientDetailPage({
  client,
  followUps,
  dealDone,
}: ClientDetailPageProps) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const qualificationLabel =
    CLIENT_QUALIFICATIONS.find((q) => q.value === client.qualificationStatus)
      ?.label ?? client.qualificationStatus;
  const archiveReasonId = `archiveReason-${client._id}`;
  const dealDoneListingLabel = dealDone?.listing
    ? [dealDone.listing.referenceCode, dealDone.listing.title]
        .filter(Boolean)
        .join(" - ") || "Bien conclu"
    : "Bien conclu";
  const dealDoneListingAddress = dealDone?.listing?.location
    ? [
        dealDone.listing.location.address,
        dealDone.listing.location.district,
        dealDone.listing.location.city,
      ]
        .filter(Boolean)
        .join(", ")
    : "";
  const dealDoneHref = `${ROUTES.DEAL_DONE_NEGOTIATIONS}&clientId=${client._id}`;

  const handleArchive = async () => {
    const trimmedReason = archiveReason.trim();
    if (trimmedReason.length < 5) {
      toast.error("Raison requise", {
        description: "La raison doit contenir au moins 5 caractères.",
      });
      return;
    }

    setIsWorking(true);
    const result = await archiveClient(client._id, trimmedReason);
    setIsWorking(false);

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Demande d'archivage envoyée", {
      description: `${client.firstName} ${client.lastName} attend une validation.`,
    });
    setArchiveOpen(false);
    setArchiveReason("");
    router.refresh();
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

  const handleCancelArchiveRequest = async () => {
    setIsWorking(true);
    const result = await cancelClientArchiveRequest(client._id);
    setIsWorking(false);

    if (!result.success) {
      toast.error("Impossible d'annuler la demande", {
        description: result.error?.message,
      });
      return;
    }

    toast.success("Demande d'archivage annulée");
    router.refresh();
  };

  return (
    <section className="container py-6 space-y-6">
      <SetBreadcrumbTitle title={client.referenceCode} />
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
        ) : client.hasPendingArchiveRequest ? (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900 dark:border-amber-800 dark:text-amber-200"
            onClick={handleCancelArchiveRequest}
            disabled={
              isWorking || !client.canCancelPendingArchiveRequest
            }
          >
            {isWorking ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : client.canCancelPendingArchiveRequest ? (
              <X className="mr-1.5 size-4" />
            ) : (
              <Clock3 className="mr-1.5 size-4" />
            )}
            {isWorking
              ? "Annulation…"
              : client.canCancelPendingArchiveRequest
                ? "Annuler la demande"
                : "Archivage en attente"}
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
          Ce client est actuellement archivé. Utilisez le bouton
          &quot;Restaurer&quot; pour le rendre actif.
        </div>
      )}

      {client.hasPendingArchiveRequest && !client.archived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <Clock3 className="size-4 shrink-0" aria-hidden="true" />
          La demande d&apos;archivage est en attente de validation.
        </div>
      )}

      {dealDone && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-950 shadow-sm dark:border-green-900/50 dark:bg-green-950/25 dark:text-green-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Deal done
                </Badge>
                <span className="text-sm font-medium">
                  Ce client est lié à un bien conclu.
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="inline-flex max-w-full items-center gap-1.5 font-medium">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{dealDoneListingLabel}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-green-800 dark:text-green-200">
                  {dealDoneListingAddress && (
                    <span>{dealDoneListingAddress}</span>
                  )}
                  {dealDone.closingDetails?.finalPrice !== undefined && (
                    <span>
                      {dealDone.closingDetails.finalPrice.toLocaleString(
                        "fr-DZ"
                      )}{" "}
                      DZD
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {dealDone.listing?._id && (
                <Button asChild variant="outline" className="bg-background">
                  <Link
                    href={ROUTES.LISTING_DETAIL_DASHBOARD(
                      dealDone.listing._id
                    )}
                  >
                    Voir le bien
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="bg-background">
                <Link href={dealDoneHref}>
                  Voir deals done
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Fiche client</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientEditForm client={client} />
        </CardContent>
      </Card>

      {/* Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Suivis associés</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={`${ROUTES.NEW_FOLLOWUP}?clientId=${client._id}`}>
            <Button className="mb-4 flex items-center gap-2">
              Ajouter un suivi <Plus className="w-4 h-4" />
            </Button>
          </Link>
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
                        <Badge>
                          {" "}
                          {fu.agent.firstname} {fu.agent.lastname}
                        </Badge>
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
      <Dialog
        open={archiveOpen}
        onOpenChange={(open) => {
          setArchiveOpen(open);
          if (!open) setArchiveReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archiver le client</DialogTitle>
            <DialogDescription>
              Cette action enverra une demande d&apos;archivage pour{" "}
              <strong>
                {client.firstName} {client.lastName}
              </strong>
              . Le client restera actif jusqu&apos;à validation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={archiveReasonId}>Raison d&apos;archivage</Label>
            <Textarea
              id={archiveReasonId}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Ex: demande non pertinente, client injoignable, dossier abandonné..."
              className="min-h-28"
              disabled={isWorking}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isWorking}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isWorking || archiveReason.trim().length < 5}
            >
              {isWorking ? "En cours…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
