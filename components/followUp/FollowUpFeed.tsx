"use client";

import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import {
  Phone,
  Mail,
  MessageSquare,
  Home,
  Clock,
  User,
  Calendar,
  LucideIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelFollowUp } from "@/lib/actions/followUp.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TYPE_STYLES: Record<string, { bg: string; ring: string; text: string }> =
  {
    COLD: { bg: "bg-blue-500", ring: "ring-blue-200", text: "text-blue-700" },
    WARM: {
      bg: "bg-orange-500",
      ring: "ring-orange-200",
      text: "text-orange-700",
    },
    HOT: { bg: "bg-red-500", ring: "ring-red-200", text: "text-red-700" },
    CUSTOM: { bg: "bg-gray-500", ring: "ring-gray-200", text: "text-gray-700" },
  };

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  VISIT: Home,
};

interface FollowUpFeedProps {
  followUps: FollowUp[];
  total?: number;
  userRole?: string;
}

export function FollowUpFeed({ followUps, total, userRole }: FollowUpFeedProps) {
  const router = useRouter();

  const handleCancel = async (id: string) => {
    await cancelFollowUp(id);
    toast.success("Suivi annulé");
    router.refresh();
  };

  const isAdmin =
    userRole === "ADMIN" || userRole === "MANAGER" || userRole === "DEVELOPER";

  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {total ?? followUps.length} suivi
        {(total ?? followUps.length) !== 1 && "s"} trouvé
        {(total ?? followUps.length) !== 1 && "s"}
        {isAdmin && <span className="ml-1">(tous les agents)</span>}
      </p>

      {/* Timeline */}
      {followUps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun suivi ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute bottom-0 left-3 top-0 w-px bg-gradient-to-b from-border via-border to-transparent sm:left-6" />

          <div className="space-y-6">
            {followUps.map((f) => {
              const Icon =
                CHANNEL_ICONS[f.channel as keyof typeof CHANNEL_ICONS];
              const typeStyle = TYPE_STYLES[f.type] || TYPE_STYLES.CUSTOM;
              const isOverdue = f.status === "OVERDUE";
              const isDone = f.status === "DONE";
              const isCancelled = f.status === "CANCELLED";

              return (
                <div key={f._id} className="group relative pl-10 sm:pl-14">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-3 sm:left-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 rounded-full items-center justify-center ring-4 ring-background transition-all duration-300",
                        isCancelled
                          ? "bg-red-500"
                          : isDone
                            ? "bg-green-500"
                            : typeStyle.bg,
                        "group-hover:scale-110"
                      )}
                    >
                      {isCancelled ? (
                        <XCircle className="h-3 w-3 text-white" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : Icon ? (
                        <Icon className="h-3 w-3 text-white" />
                      ) : null}
                    </span>
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      "rounded-xl border bg-card transition-all duration-300",
                      "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
                      isOverdue && "border-destructive/30 bg-destructive/5",
                      (isDone || isCancelled) && "opacity-70"
                    )}
                  >
                    {/* Header */}
                    <div className="border-b bg-muted/30 px-3 py-3 sm:px-5 sm:py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-2 py-1 font-semibold sm:px-3",
                              typeStyle.text,
                              "bg-background"
                            )}
                          >
                            {f.type}
                          </Badge>
                          {f.status && (
                            <Badge
                              variant={
                                isDone
                                  ? "default"
                                  : isCancelled
                                    ? "destructive"
                                  : isOverdue
                                    ? "destructive"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {f.status === "PENDING" && "En attente"}
                              {f.status === "DONE" && "Terminé"}
                              {f.status === "CANCELLED" && "Annulé"}
                              {f.status === "OVERDUE" && "En retard"}
                            </Badge>
                          )}
                        </div>
                        {f.reminderAt && (
                          <div
                            className={cn(
                              "flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                              isOverdue
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(f.reminderAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 px-3 py-4 sm:px-5">
                      {/* Title */}
                      {f.title && (
                        <h4 className="break-words text-base font-semibold leading-tight">
                          {f.title}
                        </h4>
                      )}

                      {/* Listing info */}
                      {f.listing?.title && (
                        <p className="break-words text-sm font-medium text-primary">
                          {f.listing.title}
                        </p>
                      )}

                      {/* Client */}
                      <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 break-words">
                          {f.client?.firstName} {f.client?.lastName}
                          {f.client?.referenceCode && (
                            <span className="text-xs ml-1">
                              ({f.client.referenceCode})
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Note */}
                      {f.note && (
                        <p className="break-words text-sm leading-relaxed text-muted-foreground">
                          {f.note}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col items-start gap-3 pt-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                          {isAdmin && f.agent && (
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-muted-foreground/70">
                                Agent:
                              </span>
                              <Badge variant="outline" className="max-w-full whitespace-normal break-words font-medium">
                                {f.agent.firstname} {f.agent.lastname}
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(f.createdAt)}</span>
                          </div>
                        </div>

                        {f.status !== "CANCELLED" && f._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleCancel(f._id!)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
