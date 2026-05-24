"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
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
  approveNegotiation,
  rejectNegotiation,
} from "@/lib/actions/negotiation.action";
import ROUTES from "@/constants/routes";

export interface NegotiationRequest {
  _id: string;
  status: string;
  createdAt: string | Date;
  listing?: {
    _id: string;
    referenceCode?: string;
    title?: string;
    price?: number;
  };
  client?: {
    _id: string;
    referenceCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  agent?: {
    _id: string;
    firstname?: string;
    lastname?: string;
  };
  blockingRequests?: {
    durationDays?: number;
    reason?: string;
  }[];
  closingDetails?: {
    depositAmount?: number;
    notes?: string;
  };
}

export function NegotiationRequestsList({
  requests,
}: {
  requests: NegotiationRequest[];
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        Aucune demande en attente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const clientName = request.client
          ? [request.client.firstName, request.client.lastName]
              .filter(Boolean)
              .join(" ") ||
            request.client.phone ||
            "Client"
          : "Client";
        const blockRequest = request.blockingRequests?.[0];

        return (
          <Card key={request._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">En attente de vérification</Badge>
                    <span className="text-xs text-muted-foreground">
                      Demandée le{" "}
                      {format(
                        new Date(request.createdAt),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: fr,
                        }
                      )}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {request.listing ? (
                        <Link
                          href={ROUTES.LISTING_DETAIL_DASHBOARD(
                            request.listing._id
                          )}
                          className="font-medium hover:underline"
                        >
                          {request.listing.referenceCode && (
                            <Badge
                              variant="outline"
                              className="mr-1.5 font-mono text-[10px]"
                            >
                              {request.listing.referenceCode}
                            </Badge>
                          )}
                          {request.listing.title ?? "Bien sans titre"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Bien</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {request.client ? (
                        <Link
                          href={ROUTES.CLIENT_DETAIL(request.client._id)}
                          className="text-muted-foreground hover:underline"
                        >
                          {request.client.referenceCode && (
                            <Badge
                              variant="outline"
                              className="mr-1.5 font-mono text-[10px]"
                            >
                              {request.client.referenceCode}
                            </Badge>
                          )}
                          {clientName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Client</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {request.agent && (
                      <span>
                        Agent: {request.agent.firstname}{" "}
                        {request.agent.lastname}
                      </span>
                    )}
                    {blockRequest?.durationDays && (
                      <span>
                        Blocage demandé: {blockRequest.durationDays} jour
                        {blockRequest.durationDays > 1 ? "s" : ""}
                      </span>
                    )}
                    {request.closingDetails?.depositAmount && (
                      <span>
                        Versement:{" "}
                        {request.closingDetails.depositAmount.toLocaleString(
                          "fr-DZ"
                        )}{" "}
                        DZD
                      </span>
                    )}
                  </div>

                  {(blockRequest?.reason || request.closingDetails?.notes) && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      {blockRequest?.reason ?? request.closingDetails?.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <ApproveNegotiationButton negotiationId={request._id} />
                  <RejectNegotiationDialog negotiationId={request._id} />
                  <Button size="sm" variant="outline" asChild>
                    <Link href={ROUTES.NEGOTIATION_DETAIL(request._id)}>
                      Voir
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ApproveNegotiationButton({ negotiationId }: { negotiationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    const result = await approveNegotiation({ negotiationId });
    setLoading(false);

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Négociation approuvée");
    router.refresh();
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
      )}
      Approuver
    </Button>
  );
}

function RejectNegotiationDialog({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReject() {
    setLoading(true);
    const result = await rejectNegotiation({
      negotiationId,
      managerNote: reason,
    });
    setLoading(false);

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Négociation refusée");
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-red-200 text-destructive hover:bg-red-50"
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Refuser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Refuser la négociation</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Raison du refus (optionnel)"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refuser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
