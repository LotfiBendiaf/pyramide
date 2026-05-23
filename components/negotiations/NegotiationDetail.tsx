"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NegotiationStatusBadge } from "@/components/pipeline/PipelineBadges";
import {
  requestBlockSchema,
  confirmDepositSchema,
  closeDealSchema,
  cancelNegotiationSchema,
} from "@/lib/validators/negotiation";
import {
  requestBlock,
  approveBlock,
  rejectBlock,
  confirmDeposit,
  closeDeal,
  cancelNegotiation,
} from "@/lib/actions/negotiation.action";
import {
  Building2,
  User,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Trophy,
  FileText,
} from "lucide-react";
import Link from "next/link";
import ROUTES from "@/constants/routes";

interface NegotiationDocument {
  _id?: string;
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  uploadedBy?: string;
  uploadedAt?: string | Date;
}

interface BlockingRequest {
  _id: string;
  durationDays: number;
  reason?: string;
  status: string;
  blockedUntil?: string | Date;
  requestedAt: string | Date;
  requestedBy?: { _id: string; firstname: string; lastname: string };
  reviewedBy?: { _id: string; firstname: string; lastname: string };
  managerNote?: string;
}

export interface NegotiationDetailProps {
  negotiation: {
    _id: string;
    status: string;
    createdAt: string | Date;
    closedAt?: string | Date;
    cancelledAt?: string | Date;
    cancelReason?: string;
    blockingRequests: BlockingRequest[];
    documents?: NegotiationDocument[];
    closingDetails?: {
      depositAmount?: number;
      depositAt?: string | Date;
      finalPrice?: number;
      notes?: string;
    };
    listing?: {
      _id: string;
      referenceCode?: string;
      title?: string;
      pipelineStatus?: string;
    };
    client?: {
      _id: string;
      referenceCode: string;
      firstName?: string;
      lastName?: string;
      phone: string;
    };
    agent?: { _id: string; firstname: string; lastname: string };
    visit?: { _id: string; scheduledAt: string | Date; outcome?: string };
  };
  currentUserId: string;
  isManager: boolean;
}

export function NegotiationDetail({
  negotiation,
  currentUserId,
  isManager,
}: NegotiationDetailProps) {
  const isNegotiationAgent =
    (negotiation.agent as unknown as { _id: string })?._id?.toString() ===
    currentUserId;
  const canAct = isManager || isNegotiationAgent;

  const pendingBlocks = negotiation.blockingRequests.filter(
    (r) => r.status === "PENDING"
  );
  const hasPendingBlock = pendingBlocks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              {/* Listing */}
              {negotiation.listing && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={ROUTES.LISTING_DETAIL_DASHBOARD(
                      negotiation.listing._id
                    )}
                    className="font-semibold hover:underline"
                  >
                    {negotiation.listing.referenceCode && (
                      <Badge
                        variant="outline"
                        className="font-mono text-xs mr-2"
                      >
                        {negotiation.listing.referenceCode}
                      </Badge>
                    )}
                    {negotiation.listing.title ?? "Bien sans titre"}
                  </Link>
                </div>
              )}
              {/* Client */}
              {negotiation.client && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={ROUTES.CLIENT_DETAIL(negotiation.client._id)}
                    className="hover:underline text-sm"
                  >
                    <Badge variant="outline" className="font-mono text-xs mr-2">
                      {negotiation.client.referenceCode}
                    </Badge>
                    {[negotiation.client.firstName, negotiation.client.lastName]
                      .filter(Boolean)
                      .join(" ") || negotiation.client.phone}
                  </Link>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Ouverte le{" "}
                {format(new Date(negotiation.createdAt), "dd MMMM yyyy", {
                  locale: fr,
                })}
                {negotiation.agent &&
                  ` · par ${negotiation.agent.firstname} ${negotiation.agent.lastname}`}
              </p>
            </div>
            <NegotiationStatusBadge status={negotiation.status} />
          </div>
        </CardContent>
      </Card>

      {/* Versement / closing details */}
      {negotiation.closingDetails?.depositAmount && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Versement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Montant:{" "}
              <strong>
                {negotiation.closingDetails.depositAmount.toLocaleString(
                  "fr-DZ"
                )}{" "}
                DZD
              </strong>
            </p>
            {negotiation.closingDetails.finalPrice && (
              <p>
                Prix final:{" "}
                <strong>
                  {negotiation.closingDetails.finalPrice.toLocaleString(
                    "fr-DZ"
                  )}{" "}
                  DZD
                </strong>
              </p>
            )}
            {negotiation.closingDetails.depositAt && (
              <p className="text-muted-foreground text-xs">
                Le{" "}
                {format(
                  new Date(negotiation.closingDetails.depositAt),
                  "dd MMM yyyy",
                  {
                    locale: fr,
                  }
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {negotiation.documents && negotiation.documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documents téléchargés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {negotiation.documents.map((document) => (
              <div
                key={document._id ?? document.publicId}
                className="rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {document.originalFilename ?? document.publicId}
                    </p>
                    {document.format && (
                      <p className="text-xs text-muted-foreground">
                        Type : {document.format.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(document.secureUrl ?? document.url, "_blank")
                    }
                    disabled={!document.secureUrl && !document.url}
                  >
                    Ouvrir
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {document.uploadedAt && (
                    <span>
                      Ajouté le{" "}
                      {format(new Date(document.uploadedAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  )}
                  {document.bytes != null && (
                    <span>{(document.bytes / 1024).toFixed(1)} KB</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cancellation info */}
      {negotiation.status === "CANCELLED" && negotiation.cancelReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-destructive mb-1">
              Négociation annulée
            </p>
            <p className="text-muted-foreground">{negotiation.cancelReason}</p>
            {negotiation.cancelledAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Le{" "}
                {format(new Date(negotiation.cancelledAt), "dd MMM yyyy", {
                  locale: fr,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deal done */}
      {negotiation.status === "DEAL_DONE" && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-700">Affaire conclue !</p>
              {negotiation.closedAt && (
                <p className="text-xs text-green-600">
                  Le{" "}
                  {format(new Date(negotiation.closedAt), "dd MMMM yyyy", {
                    locale: fr,
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocking requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" /> Demandes de blocage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {negotiation.blockingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune demande de blocage.
            </p>
          ) : (
            negotiation.blockingRequests.map((req, i) => (
              <div
                key={req._id ?? i}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">
                      {req.durationDays} jour{req.durationDays > 1 ? "s" : ""}
                      {req.reason && (
                        <span className="font-normal text-muted-foreground ml-2">
                          — {req.reason}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Demandé le{" "}
                      {format(new Date(req.requestedAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                      {req.requestedBy &&
                        ` par ${req.requestedBy.firstname} ${req.requestedBy.lastname}`}
                    </p>
                    {req.blockedUntil && req.status === "APPROVED" && (
                      <p className="text-xs text-muted-foreground">
                        Bloqué jusqu&apos;au{" "}
                        {format(new Date(req.blockedUntil), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    )}
                    {req.managerNote && (
                      <p className="text-xs italic text-muted-foreground">
                        Note : {req.managerNote}
                      </p>
                    )}
                  </div>
                  <BlockStatusBadge status={req.status} />
                </div>
                {/* Manager approve/reject buttons */}
                {req.status === "PENDING" && isManager && (
                  <div className="flex gap-2 pt-1">
                    <ApproveBlockButton
                      negotiationId={negotiation._id}
                      blockingRequestId={req._id}
                    />
                    <RejectBlockButton
                      negotiationId={negotiation._id}
                      blockingRequestId={req._id}
                    />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Request new block */}
          {negotiation.status === "ACTIVE" && canAct && !hasPendingBlock && (
            <div className="pt-2">
              <RequestBlockDialog negotiationId={negotiation._id} />
            </div>
          )}
          {hasPendingBlock && canAct && (
            <p className="text-xs text-amber-600 font-medium">
              Une demande de blocage est en attente d&apos;approbation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {canAct && ["ACTIVE", "CLOSING"].includes(negotiation.status) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {negotiation.status === "ACTIVE" && (
              <ConfirmDepositDialog negotiationId={negotiation._id} />
            )}
            {negotiation.status === "CLOSING" && (
              <CloseDealDialog negotiationId={negotiation._id} />
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href={ROUTES.DOCUMENTS}>Ajouter un document</Link>
            </Button>
            <CancelNegotiationDialog negotiationId={negotiation._id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── helpers ── */

function BlockStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { variant: "warning" | "success" | "secondary" | "outline"; label: string }
  > = {
    PENDING: { variant: "warning", label: "En attente" },
    APPROVED: { variant: "success", label: "Approuvé" },
    REJECTED: { variant: "secondary", label: "Refusé" },
  };
  const cfg = map[status] ?? { variant: "outline", label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ── Block dialogs ── */

function ApproveBlockButton({
  negotiationId,
  blockingRequestId,
}: {
  negotiationId: string;
  blockingRequestId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handle() {
    setLoading(true);
    const result = await approveBlock({ negotiationId, blockingRequestId });
    if (!result.success)
      toast.error("Erreur", { description: result.error?.message });
    else {
      toast.success("Blocage approuvé");
      router.refresh();
    }
    setLoading(false);
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-green-600 border-green-200 hover:bg-green-50"
      onClick={handle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
      )}
      Approuver
    </Button>
  );
}

function RejectBlockButton({
  negotiationId,
  blockingRequestId,
}: {
  negotiationId: string;
  blockingRequestId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handle() {
    setLoading(true);
    const result = await rejectBlock({ negotiationId, blockingRequestId });
    if (!result.success)
      toast.error("Erreur", { description: result.error?.message });
    else {
      toast.success("Blocage refusé");
      router.refresh();
    }
    setLoading(false);
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive border-red-200 hover:bg-red-50"
      onClick={handle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
      ) : (
        <XCircle className="h-3.5 w-3.5 mr-1" />
      )}
      Refuser
    </Button>
  );
}

function RequestBlockDialog({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  type Values = z.infer<typeof requestBlockSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(requestBlockSchema),
    defaultValues: { negotiationId, durationDays: 7, reason: "" },
  });
  async function onSubmit(values: Values) {
    const result = await requestBlock(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Demande de blocage envoyée");
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Lock className="h-3.5 w-3.5 mr-1.5" />
          Demander un blocage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Demande de blocage</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durée (jours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Justification du blocage…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDepositDialog({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  type Values = z.infer<typeof confirmDepositSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(confirmDepositSchema),
    defaultValues: {
      negotiationId,
      depositAmount: 0,
      finalPrice: 0,
      notes: "",
    },
  });
  async function onSubmit(values: Values) {
    const result = await confirmDeposit(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Versement confirmé");
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Banknote className="h-3.5 w-3.5 mr-1.5" />
          Confirmer le versement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmer le versement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant du versement (DZD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix final convenu (DZD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Confirmer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CloseDealDialog({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  type Values = z.infer<typeof closeDealSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(closeDealSchema),
    defaultValues: { negotiationId, finalPrice: 0, notes: "" },
  });
  async function onSubmit(values: Values) {
    const result = await closeDeal(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Affaire conclue !");
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Trophy className="h-3.5 w-3.5 mr-1.5" />
          Clôturer l&apos;affaire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Clôturer l&apos;affaire</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="finalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix final (DZD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Clôturer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CancelNegotiationDialog({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  type Values = z.infer<typeof cancelNegotiationSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(cancelNegotiationSchema),
    defaultValues: { negotiationId, cancelReason: "" },
  });
  async function onSubmit(values: Values) {
    const result = await cancelNegotiation(values);
    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }
    toast.success("Négociation annulée");
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-red-200 hover:bg-red-50"
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          Annuler la négociation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Annuler la négociation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancelReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison de l&apos;annulation</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Client s'est désisté, offre refusée…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Retour
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
