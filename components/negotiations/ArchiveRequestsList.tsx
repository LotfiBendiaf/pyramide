"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Archive,
  Building2,
  CheckCircle2,
  Loader2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveArchiveRequest,
  rejectArchiveRequest,
} from "@/lib/actions/archiveRequest.action";
import ROUTES from "@/constants/routes";

export interface ArchiveRequestItem {
  _id: string;
  entityType: "CLIENT" | "LISTING";
  entityId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | Date;
  requestedBy?: {
    firstname?: string;
    lastname?: string;
    role?: string;
  };
  relatedClient?: {
    _id: string;
    referenceCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  relatedListing?: {
    _id: string;
    referenceCode?: string;
    title?: string;
  };
}

export function ArchiveRequestsList({
  requests,
}: {
  requests: ArchiveRequestItem[];
}) {
  const router = useRouter();
  const reviewLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING" && !completedIds.includes(request._id)
  );

  async function reviewRequests(
    requestIds: string[],
    decision: "approve" | "reject",
    managerNote?: string
  ) {
    if (reviewLock.current || requestIds.length === 0) return false;
    reviewLock.current = true;
    setBusy(true);
    const succeeded: string[] = [];
    const errors: string[] = [];

    try {
      const review = decision === "approve" ? approveArchiveRequest : rejectArchiveRequest;
      for (const requestId of requestIds) {
        try {
          const result = await review({ requestId, managerNote });
          if (result.success) {
            succeeded.push(requestId);
          } else {
            errors.push(result.error?.message ?? "Une erreur est survenue.");
          }
        } catch {
          errors.push("Impossible de traiter la demande. Veuillez réessayer.");
        }
      }
      if (succeeded.length > 0) {
        setCompletedIds((ids) => [...ids, ...succeeded]);
        toast.success(
          `${succeeded.length} demande(s) d'archivage ${decision === "approve" ? "approuvée(s)" : "refusée(s)"}`
        );
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} demande(s) non traitée(s)`, {
          description: errors[0],
        });
      }
      return errors.length === 0;
    } finally {
      reviewLock.current = false;
      setBusy(false);
      router.refresh();
    }
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        Aucune demande d&apos;archivage en attente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <ApproveArchiveButton
          bulk
          disabled={busy}
          onReview={() => reviewRequests(pendingRequests.map((request) => request._id), "approve")}
        />
        <RejectArchiveDialog
          bulk
          disabled={busy}
          onReview={(reason) => reviewRequests(pendingRequests.map((request) => request._id), "reject", reason)}
        />
      </div>
      {pendingRequests.map((request) => {
        const agentName =
          [request.requestedBy?.firstname, request.requestedBy?.lastname]
            .filter(Boolean)
            .join(" ") || "Agent";
        const clientName = request.relatedClient
          ? [request.relatedClient.firstName, request.relatedClient.lastName]
              .filter(Boolean)
              .join(" ") ||
            request.relatedClient.phone ||
            "Client"
          : "Client";

        return (
          <Card key={request._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Archive en attente</Badge>
                    <Badge variant="outline">
                      {request.entityType === "CLIENT" ? "Client" : "Bien"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Demandée le{" "}
                      {format(new Date(request.createdAt), "dd MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Soumise par {agentName}
                      </span>
                    </div>

                    {request.entityType === "CLIENT" ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {request.relatedClient ? (
                          <Link
                            href={ROUTES.CLIENT_DETAIL(
                              request.relatedClient._id
                            )}
                            className="font-medium hover:underline"
                          >
                            {request.relatedClient.referenceCode && (
                              <Badge
                                variant="outline"
                                className="mr-1.5 font-mono text-[10px]"
                              >
                                {request.relatedClient.referenceCode}
                              </Badge>
                            )}
                            {clientName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            Client introuvable
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {request.relatedListing ? (
                          <Link
                            href={ROUTES.LISTING_DETAIL_DASHBOARD(
                              request.relatedListing._id
                            )}
                            className="font-medium hover:underline"
                          >
                            {request.relatedListing.referenceCode && (
                              <Badge
                                variant="outline"
                                className="mr-1.5 font-mono text-[10px]"
                              >
                                {request.relatedListing.referenceCode}
                              </Badge>
                            )}
                            {request.relatedListing.title ?? "Bien sans titre"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            Bien introuvable
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="max-w-2xl text-sm text-muted-foreground">
                    {request.reason}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <ApproveArchiveButton disabled={busy} onReview={() => reviewRequests([request._id], "approve")} />
                  <RejectArchiveDialog disabled={busy} onReview={(reason) => reviewRequests([request._id], "reject", reason)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface ReviewButtonProps {
  bulk?: boolean;
  disabled: boolean;
  onReview: (reason?: string) => Promise<boolean>;
}

function ApproveArchiveButton({ bulk, disabled, onReview }: ReviewButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await onReview();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={disabled || loading}>
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
      )}
      {bulk ? "Tout approuver" : "Approuver"}
    </Button>
  );
}

function RejectArchiveDialog({ bulk, disabled, onReview }: ReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    try {
      if (await onReview(reason)) {
        setOpen(false);
        setReason("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!loading) setOpen(value); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || loading}
          className="border-red-200 text-destructive hover:bg-red-50"
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          {bulk ? "Tout refuser" : "Refuser"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {bulk ? "Refuser toutes les demandes d’archivage" : "Refuser l’archivage"}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          disabled={loading}
          onChange={(event) => setReason(event.target.value)}
          placeholder={bulk ? "Raison du refus pour toutes les demandes (optionnel)" : "Raison du refus (optionnel)"}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={disabled || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bulk ? "Tout refuser" : "Refuser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
