"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TemperatureBadge } from "@/components/pipeline/PipelineBadges";
import {
  submitToPhase1,
  approvePhase1,
  rejectPhase1,
  approvePhase2,
  rejectPhase2,
} from "@/lib/actions/client.action";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PhoneCall,
  Scale,
  Search,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";

interface Agent {
  _id: string;
  firstname: string;
  lastname: string;
}

interface Props {
  clientId: string;
  pipelineStage: string;
  clientTemperature?: string;
  phase2AgentId?: string;
  isManager: boolean;
  currentUserId: string;
  agents: Agent[];
}

const approvePhase1Schema = z.object({
  phase2AgentId: z.string().min(1, "L'agent Phase 2 est requis"),
  notes: z.string().optional(),
});

const rejectionSchema = z.object({
  notes: z.string().optional(),
});

const approvePhase2Schema = z.object({
  temperature: z.enum(["HOT", "WARM", "COLD"], {
    required_error: "La température est requise",
  }),
  notes: z.string().optional(),
});

function ApprovePhase1Dialog({
  clientId,
  agents,
  onSuccess,
}: {
  clientId: string;
  agents: Agent[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof approvePhase1Schema>>({
    resolver: zodResolver(approvePhase1Schema),
    defaultValues: { phase2AgentId: "", notes: "" },
  });

  const onSubmit = async (values: z.infer<typeof approvePhase1Schema>) => {
    const result = await approvePhase1({
      clientId,
      phase2AgentId: values.phase2AgentId,
      notes: values.notes,
    });
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    toast.success("Phase 1 approuvée — agent Phase 2 assigné");
    setOpen(false);
    form.reset();
    onSuccess();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
        Approuver Phase 1
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver Phase 1</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phase2AgentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Phase 2</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a._id} value={a._id}>
                            {a.firstname} {a.lastname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Observations..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  Approuver
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RejectPhase1Dialog({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { notes: "" },
  });

  const onSubmit = async (values: z.infer<typeof rejectionSchema>) => {
    const result = await rejectPhase1({ clientId, notes: values.notes });
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    toast.success("Phase 1 refusée");
    setOpen(false);
    form.reset();
    onSuccess();
  };

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4 mr-1.5" />
        Refuser
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser Phase 1</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Raison du refus..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  Refuser
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ApprovePhase2Dialog({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof approvePhase2Schema>>({
    resolver: zodResolver(approvePhase2Schema),
    defaultValues: { notes: "" },
  });

  const onSubmit = async (values: z.infer<typeof approvePhase2Schema>) => {
    const result = await approvePhase2({
      clientId,
      temperature: values.temperature,
      notes: values.notes,
    });
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    toast.success("Phase 2 approuvée — client qualifié");
    setOpen(false);
    form.reset();
    onSuccess();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
        Approuver Phase 2
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver Phase 2 — Qualifier le client</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Température client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HOT">
                          Chaud — Recherche active immédiate
                        </SelectItem>
                        <SelectItem value="WARM">
                          Normal — Suivi régulier
                        </SelectItem>
                        <SelectItem value="COLD">
                          Froid — Suivi long terme
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Observations..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  Qualifier
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RejectPhase2Dialog({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { notes: "" },
  });

  const onSubmit = async (values: z.infer<typeof rejectionSchema>) => {
    const result = await rejectPhase2({ clientId, notes: values.notes });
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    toast.success("Phase 2 refusée");
    setOpen(false);
    form.reset();
    onSuccess();
  };

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4 mr-1.5" />
        Refuser
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser Phase 2</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Raison du refus..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  Refuser
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const TIMELINE_STAGES = [
  { value: "LEAD", label: "Lead", icon: UserPlus },
  { value: "PHASE_1_REVIEW", label: "Phase 1", icon: ClipboardList },
  { value: "PHASE_2_REVIEW", label: "Phase 2", icon: UserCheck },
  { value: "ACTIVE_SEARCH", label: "Recherche", icon: Search },
  { value: "FOLLOW_UP", label: "Suivi", icon: PhoneCall },
  { value: "IN_NEGOTIATION", label: "Négociation", icon: Scale },
  { value: "CLOSED", label: "Clôturé", icon: CheckCircle2 },
] as const;

function PipelineTimeline({ stage }: { stage: string }) {
  const isArchived = stage === "ARCHIVED";
  const currentIndex = TIMELINE_STAGES.findIndex((s) => s.value === stage);

  return (
    <div>
      <div className="flex items-start p-2">
        {TIMELINE_STAGES.map((s, index) => {
          const Icon = s.icon;
          const stepState: "completed" | "review" | "active" | "pending" =
            isArchived
              ? "pending"
              : currentIndex > index
                ? "completed"
                : currentIndex === index
                  ? s.value === "PHASE_1_REVIEW" || s.value === "PHASE_2_REVIEW"
                    ? "review"
                    : "active"
                  : "pending";

          const circleClass = [
            "flex items-center justify-center rounded-full w-9 h-9 border-2 transition-all duration-200 flex-shrink-0",
            stepState === "completed" &&
              "bg-emerald-500 border-emerald-500 text-white",
            stepState === "review" &&
              "bg-amber-500 border-amber-500 text-white ring-2 ring-amber-300 ring-offset-1",
            stepState === "active" &&
              "bg-primary border-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1",
            stepState === "pending" &&
              "bg-background border-border text-muted-foreground/40",
          ]
            .filter(Boolean)
            .join(" ");

          const labelClass = [
            "text-[10px] text-center leading-tight w-12",
            stepState === "completed" && "text-emerald-600 font-medium",
            stepState === "review" && "text-amber-600 font-semibold",
            stepState === "active" && "text-primary font-semibold",
            stepState === "pending" && "text-muted-foreground/50",
          ]
            .filter(Boolean)
            .join(" ");

          const connectorClass = [
            "flex-1 h-0.5 mx-1 mt-[1.125rem] min-w-2",
            !isArchived && currentIndex > index
              ? "bg-emerald-500"
              : "bg-border",
          ].join(" ");

          return (
            <Fragment key={s.value}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={circleClass}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={labelClass}>{s.label}</span>
              </div>
              {index < TIMELINE_STAGES.length - 1 && (
                <div className={connectorClass} />
              )}
            </Fragment>
          );
        })}
      </div>
      {isArchived && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Archive className="h-3.5 w-3.5" />
          <span>Ce client est archivé</span>
        </div>
      )}
    </div>
  );
}

export function ClientPipelineSection({
  clientId,
  pipelineStage,
  clientTemperature,
  phase2AgentId,
  isManager,
  currentUserId,
  agents,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => router.refresh();

  const handleSubmitPhase1 = async () => {
    setSubmitting(true);
    const result = await submitToPhase1(clientId);
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    toast.success("Client soumis en Phase 1");
    refresh();
  };

  const canReviewPhase2 = isManager || phase2AgentId === currentUserId;
  const isActiveStage = !["CLOSED", "ARCHIVED", "CANCELLED"].includes(
    pipelineStage
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base syncopate-bold">Pipeline</CardTitle>
          {clientTemperature && (
            <TemperatureBadge temperature={clientTemperature} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <PipelineTimeline stage={pipelineStage} />
        </div>

        {isActiveStage && (
          <div className="flex items-center gap-2 flex-wrap pt-6 border-t">
            {pipelineStage === "LEAD" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmitPhase1}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                )}
                Soumettre en Phase 1
              </Button>
            )}

            {pipelineStage === "PHASE_1_REVIEW" && isManager && (
              <>
                <ApprovePhase1Dialog
                  clientId={clientId}
                  agents={agents}
                  onSuccess={refresh}
                />
                <RejectPhase1Dialog clientId={clientId} onSuccess={refresh} />
              </>
            )}

            {pipelineStage === "PHASE_2_REVIEW" && canReviewPhase2 && (
              <>
                <ApprovePhase2Dialog clientId={clientId} onSuccess={refresh} />
                <RejectPhase2Dialog clientId={clientId} onSuccess={refresh} />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
