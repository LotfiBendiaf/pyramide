"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Archive,
  Ban,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  MessageSquarePlus,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Upload,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import {
  cancelFollowUp,
  createListingFollowUp,
  markFollowUpDone,
} from "@/lib/actions/followUp.action";
import { toast } from "sonner";

type ListingFollowUpAgent =
  | string
  | { _id?: string; firstname?: string; lastname?: string; name?: string }
  | undefined;

type ListingFollowUpItem = Omit<FollowUp, "agent" | "listing" | "client"> & {
  agent?: ListingFollowUpAgent;
};

type TimelineEntry = {
  id: string;
  date: Date;
  kind: "auto" | "task";
  title: string;
  description?: string;
  icon: typeof History;
  tone: "default" | "success" | "warning" | "destructive";
  followUp?: ListingFollowUpItem;
};

const TASK_SUGGESTIONS = [
  "Contact propriétaire",
  "Visite photo à planifier",
  "Relance négociation",
  "Document manquant",
];

function toneClasses(tone: TimelineEntry["tone"]) {
  switch (tone) {
    case "success":
      return { dot: "bg-green-500", text: "text-green-700" };
    case "warning":
      return { dot: "bg-amber-500", text: "text-amber-700" };
    case "destructive":
      return { dot: "bg-red-500", text: "text-red-700" };
    default:
      return { dot: "bg-slate-500", text: "text-slate-700" };
  }
}

function buildAutoEvents(listing: Listing): TimelineEntry[] {
  const events: TimelineEntry[] = [];

  if (listing.createdAt) {
    events.push({
      id: "created",
      date: new Date(listing.createdAt),
      kind: "auto",
      title: "Annonce enregistrée",
      icon: Sparkles,
      tone: "default",
    });
  }

  if (listing.photoVisitScheduledAt) {
    events.push({
      id: "photo-scheduled",
      date: new Date(listing.photoVisitScheduledAt),
      kind: "auto",
      title: "Visite photo programmée",
      icon: CalendarClock,
      tone: "default",
    });
  }

  if (listing.photoVisitCompletedAt) {
    events.push({
      id: "photo-completed",
      date: new Date(listing.photoVisitCompletedAt),
      kind: "auto",
      title: "Visite photo réalisée",
      description: listing.photoVisitNotes,
      icon: CheckCircle2,
      tone: "success",
    });
  }

  if (listing.evaluation?.evaluatedAt) {
    events.push({
      id: "evaluated",
      date: new Date(listing.evaluation.evaluatedAt),
      kind: "auto",
      title: "Bien évalué",
      description:
        listing.evaluation.finalScore !== undefined
          ? `Note finale : ${listing.evaluation.finalScore}/10`
          : undefined,
      icon: Star,
      tone: "default",
    });
  }

  if (listing.validatedAt) {
    events.push({
      id: "validated",
      date: new Date(listing.validatedAt),
      kind: "auto",
      title:
        listing.validationStatus === "VALIDATED"
          ? "Annonce validée"
          : "Annonce approuvée",
      description: listing.referenceCode
        ? `Référence attribuée : ${listing.referenceCode}`
        : undefined,
      icon: ShieldCheck,
      tone: "success",
    });
  }

  if (listing.isPublished && listing.publishedAt) {
    events.push({
      id: "published",
      date: new Date(listing.publishedAt),
      kind: "auto",
      title: "Annonce publiée en ligne",
      icon: Upload,
      tone: "success",
    });
  }

  if (listing.status === "Vendu" || listing.status === "Loué") {
    events.push({
      id: "closed",
      date: new Date(listing.updatedAt),
      kind: "auto",
      title: listing.status === "Vendu" ? "Bien marqué vendu" : "Bien marqué loué",
      icon: Tag,
      tone: "success",
    });
  }

  if (listing.status === "Retiré") {
    events.push({
      id: "withdrawn",
      date: new Date(listing.updatedAt),
      kind: "auto",
      title: "Annonce retirée",
      icon: Ban,
      tone: "warning",
    });
  }

  if (listing.archived && listing.archivedAt) {
    events.push({
      id: "archived",
      date: new Date(listing.archivedAt),
      kind: "auto",
      title: "Annonce archivée",
      icon: Archive,
      tone: "destructive",
    });
  }

  return events;
}

function getAgentName(agent: ListingFollowUpAgent) {
  if (!agent || typeof agent === "string") return null;
  return (
    [agent.firstname, agent.lastname].filter(Boolean).join(" ") ||
    agent.name ||
    null
  );
}

function AddTaskDialog({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reminderAt, setReminderAt] = useState<Date | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const resetForm = () => {
    setTitle("");
    setNote("");
    setReminderAt(undefined);
  };

  const handleSubmit = () => {
    if (!note.trim()) {
      toast.error("Veuillez saisir une note");
      return;
    }

    startTransition(async () => {
      const result = await createListingFollowUp({
        listing: listingId,
        title: title.trim() || undefined,
        note: note.trim(),
        reminderAt,
      });

      if (!result.success) {
        toast.error(result.error?.message ?? "Erreur lors de l'ajout du suivi");
        return;
      }

      toast.success(reminderAt ? "Tâche planifiée" : "Suivi ajouté");
      resetForm();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Nouveau suivi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un suivi</DialogTitle>
          <DialogDescription>
            Consignez une action ou une tâche liée à cette annonce.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TASK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTitle(suggestion)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  title === suggestion
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Titre</label>
            <Input
              placeholder="Ex: Relance propriétaire"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Détails du suivi…"
              className="min-h-[100px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rappel (optionnel)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-left",
                    !reminderAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {reminderAt
                    ? format(reminderAt, "dd/MM/yyyy HH:mm")
                    : "Aucun rappel"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={reminderAt}
                  onSelect={(date) => {
                    if (!date) return setReminderAt(undefined);
                    const prev = reminderAt;
                    date.setHours(prev?.getHours() ?? 9, prev?.getMinutes() ?? 0, 0, 0);
                    setReminderAt(date);
                  }}
                />
                <div className="border-t p-3">
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Heure
                  </label>
                  <Input
                    type="time"
                    value={reminderAt ? format(reminderAt, "HH:mm") : "09:00"}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      const date = reminderAt ? new Date(reminderAt) : new Date();
                      date.setHours(hours, minutes, 0, 0);
                      setReminderAt(date);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ListingFollowUpsSection({
  listing,
  followUps,
}: {
  listing: Listing;
  followUps: FollowUp[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const timeline = useMemo(() => {
    const autoEvents = buildAutoEvents(listing);
    const taskEvents: TimelineEntry[] = (followUps as ListingFollowUpItem[]).map((f) => {
      const isDone = f.status === "DONE";
      const isCancelled = f.status === "CANCELLED";
      const isOverdue = f.status === "OVERDUE";
      return {
        id: f._id!,
        date: new Date(f.reminderAt ?? f.createdAt),
        kind: "task",
        title: f.title || "Suivi",
        description: f.note,
        icon: isCancelled
          ? XCircle
          : isDone
            ? CheckCircle2
            : isOverdue
              ? Clock3
              : PenLine,
        tone: isCancelled
          ? "destructive"
          : isDone
            ? "success"
            : isOverdue
              ? "warning"
              : "default",
        followUp: f,
      };
    });

    return [...autoEvents, ...taskEvents].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [listing, followUps]);

  const handleMarkDone = async (id: string) => {
    setPendingId(id);
    await markFollowUpDone(id);
    toast.success("Suivi marqué comme terminé");
    setPendingId(null);
    router.refresh();
  };

  const handleCancel = async (id: string) => {
    setPendingId(id);
    await cancelFollowUp(id);
    toast.success("Suivi annulé");
    setPendingId(null);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          Historique &amp; Suivis
        </CardTitle>
        <AddTaskDialog listingId={listing._id} />
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            <MessageSquarePlus className="size-8 opacity-60" />
            <p className="text-sm">Aucun historique pour cette annonce.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-3 top-0 w-px bg-gradient-to-b from-border via-border to-transparent" />
            <div className="space-y-6">
              {timeline.map((entry) => {
                const Icon = entry.icon;
                const { dot, text } = toneClasses(entry.tone);
                const agentName =
                  entry.kind === "task"
                    ? getAgentName(entry.followUp?.agent)
                    : null;

                return (
                  <div key={entry.id} className="group relative pl-10">
                    <div className="absolute left-0 top-1">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background transition-transform",
                          dot,
                          "group-hover:scale-110"
                        )}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </span>
                    </div>

                    <div
                      className={cn(
                        "rounded-lg border bg-card p-4",
                        entry.followUp?.status === "CANCELLED" && "opacity-60"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={entry.kind === "auto" ? "outline" : "secondary"}
                            className={cn("font-medium", text)}
                          >
                            {entry.kind === "auto" ? "Système" : "Tâche"}
                          </Badge>
                          <h4 className="text-sm font-semibold">{entry.title}</h4>
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </time>
                      </div>

                      {entry.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                      )}

                      {entry.kind === "task" && entry.followUp && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            {agentName && (
                              <span>Par&nbsp;: {agentName}</span>
                            )}
                            {entry.followUp.reminderAt && (
                              <span className="flex items-center gap-1">
                                <CalendarClock className="size-3.5" />
                                Rappel : {formatDate(entry.followUp.reminderAt)}
                              </span>
                            )}
                          </div>

                          {entry.followUp.status !== "DONE" &&
                            entry.followUp.status !== "CANCELLED" && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={pendingId === entry.followUp._id}
                                  onClick={() => handleMarkDone(entry.followUp!._id!)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Terminer
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive"
                                  disabled={pendingId === entry.followUp._id}
                                  onClick={() => handleCancel(entry.followUp!._id!)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Annuler
                                </Button>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
