"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  MessageCircle,
  UserRound,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchFollowUpsByClient } from "@/lib/actions/followUp.action";
import { cn } from "@/lib/utils";

type FollowUpWithDetails = Omit<FollowUp, "agent" | "listing"> & {
  agent?:
    | string
    | {
        firstname?: string;
        lastname?: string;
        name?: string;
      };
  listing?:
    | string
    | {
        title?: string;
        description?: string;
      }
    | null;
};

const TYPE_LABELS: Record<FollowUp["type"], string> = {
  COLD: "Froid",
  WARM: "Tiède",
  HOT: "Chaud",
  CUSTOM: "Personnalisé",
};

const TYPE_STYLES: Record<FollowUp["type"], string> = {
  COLD: "border-sky-200 bg-sky-50 text-sky-700",
  WARM: "border-amber-200 bg-amber-50 text-amber-700",
  HOT: "border-red-200 bg-red-50 text-red-700",
  CUSTOM: "border-slate-200 bg-slate-50 text-slate-700",
};

const STATUS_LABELS: Record<NonNullable<FollowUp["status"]>, string> = {
  PENDING: "En attente",
  DONE: "Terminé",
  OVERDUE: "En retard",
  CANCELLED: "Annulé",
};

const CHANNEL_LABELS: Record<NonNullable<FollowUp["channel"]>, string> = {
  CALL: "Appel",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visite",
};

function formatFollowUpDate(date?: Date | string) {
  if (!date) return "Date non renseignée";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getAgentName(agent: FollowUpWithDetails["agent"]) {
  if (!agent || typeof agent === "string") return null;

  return (
    [agent.firstname, agent.lastname].filter(Boolean).join(" ") ||
    agent.name ||
    null
  );
}

function getListingName(listing: FollowUpWithDetails["listing"]) {
  if (!listing || typeof listing === "string") return null;
  return listing.title || listing.description?.slice(0, 80) || null;
}

function FollowUpCard({
  followUp,
  featured = false,
}: {
  followUp: FollowUpWithDetails;
  featured?: boolean;
}) {
  const agentName = getAgentName(followUp.agent);
  const listingName = getListingName(followUp.listing);
  const status = followUp.status ?? "PENDING";

  return (
    <article
      className={cn(
        "rounded-lg border bg-background p-4",
        featured && "border-primary/30 bg-primary/[0.03] shadow-sm"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={TYPE_STYLES[followUp.type]}>
            {TYPE_LABELS[followUp.type]}
          </Badge>
          {followUp.channel && (
            <Badge variant="secondary">
              {CHANNEL_LABELS[followUp.channel]}
            </Badge>
          )}
          <Badge
            variant={
              status === "CANCELLED" || status === "OVERDUE"
                ? "destructive"
                : status === "DONE"
                  ? "default"
                  : "outline"
            }
          >
            {status === "DONE" && <CheckCircle2 className="size-3" />}
            {status === "CANCELLED" && <XCircle className="size-3" />}
            {status === "PENDING" && <Clock3 className="size-3" />}
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatFollowUpDate(followUp.createdAt)}
        </time>
      </div>

      <div className="mt-3 space-y-2">
        {followUp.title && (
          <h4 className="text-sm font-semibold">{followUp.title}</h4>
        )}
        {followUp.note && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {followUp.note}
          </p>
        )}
        {!followUp.title && !followUp.note && (
          <p className="text-sm italic text-muted-foreground">
            Aucun détail renseigné.
          </p>
        )}
      </div>

      {(agentName || listingName || followUp.reminderAt) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          {agentName && (
            <span className="flex items-center gap-1.5">
              <UserRound className="size-3.5" />
              {agentName}
            </span>
          )}
          {listingName && <span>Bien : {listingName}</span>}
          {followUp.reminderAt && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              Rappel : {formatFollowUpDate(followUp.reminderAt)}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

interface ClientFollowUpsDialogProps {
  clientId: string;
  clientName: string;
}

export default function ClientFollowUpsDialog({
  clientId,
  clientName,
}: ClientFollowUpsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpWithDetails[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadFollowUps = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchFollowUpsByClient(clientId);

    if (result.success) {
      setFollowUps((result.data ?? []) as FollowUpWithDetails[]);
      setSelectedIndex(0);
      setLoaded(true);
    } else {
      setError(result.error?.message ?? "Impossible de charger les suivis.");
    }

    setLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !loading) void loadFollowUps();
  };

  const selectedFollowUp = followUps[selectedIndex];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <History className="size-4" />
          Voir les suivis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Suivis — {clientName}</DialogTitle>
          <DialogDescription>
            Naviguez dans l&apos;historique des échanges avec ce client.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Chargement des suivis...
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" onClick={loadFollowUps}>
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && loaded && followUps.length === 0 && (
          <div className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
            <MessageCircle className="size-8 opacity-60" />
            <p className="text-sm">Aucun suivi pour ce client.</p>
          </div>
        )}

        {!loading && !error && selectedFollowUp && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="size-4 text-primary" />
                {selectedIndex === 0 ? "Dernier suivi" : "Suivi précédent"}
              </h3>
              <span
                className="text-xs tabular-nums text-muted-foreground"
                aria-live="polite"
              >
                {selectedIndex + 1} / {followUps.length}
              </span>
            </div>

            <ScrollArea className="max-h-[52vh] pr-3">
              <FollowUpCard
                key={selectedFollowUp._id ?? selectedIndex}
                followUp={selectedFollowUp}
                featured
              />
            </ScrollArea>

            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSelectedIndex((index) =>
                    Math.min(index + 1, followUps.length - 1)
                  )
                }
                disabled={selectedIndex === followUps.length - 1}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSelectedIndex((index) => Math.max(index - 1, 0))
                }
                disabled={selectedIndex === 0}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
