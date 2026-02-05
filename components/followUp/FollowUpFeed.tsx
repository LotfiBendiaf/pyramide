"use client";

import { useState, useMemo } from "react";
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
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { markFollowUpDone } from "@/lib/actions/followUp.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TYPE_STYLES: Record<string, { bg: string; ring: string; text: string }> = {
  COLD: { bg: "bg-blue-500", ring: "ring-blue-200", text: "text-blue-700" },
  WARM: { bg: "bg-orange-500", ring: "ring-orange-200", text: "text-orange-700" },
  HOT: { bg: "bg-red-500", ring: "ring-red-200", text: "text-red-700" },
  CUSTOM: { bg: "bg-gray-500", ring: "ring-gray-200", text: "text-gray-700" },
};

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  VISIT: Home,
};

const TYPE_FILTERS = [
  { value: "ALL", label: "Tous", color: "bg-gray-500" },
  { value: "COLD", label: "Cold", color: "bg-blue-500" },
  { value: "WARM", label: "Warm", color: "bg-orange-500" },
  { value: "HOT", label: "Hot", color: "bg-red-500" },
];

const STATUS_FILTERS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "DONE", label: "Terminé" },
  { value: "OVERDUE", label: "En retard" },
];

interface FollowUpFeedProps {
  followUps: FollowUp[];
  userRole?: string;
}

export function FollowUpFeed({ followUps, userRole }: FollowUpFeedProps) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const router = useRouter();

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      const matchesType = typeFilter === "ALL" || f.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
      return matchesType && matchesStatus;
    });
  }, [followUps, typeFilter, statusFilter]);

  const handleMarkDone = async (id: string) => {
    await markFollowUpDone(id);
    toast.success("Suivi marqué comme terminé");
    router.refresh();
  };

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Type:</span>
          <div className="flex gap-1">
            {TYPE_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(filter.value)}
                className="h-8"
              >
                {filter.value !== "ALL" && (
                  <span className={cn("h-2 w-2 rounded-full mr-1.5", filter.color)} />
                )}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Statut:</span>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className="h-8"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredFollowUps.length} suivi{filteredFollowUps.length !== 1 && "s"} trouvé{filteredFollowUps.length !== 1 && "s"}
        {isAdmin && <span className="ml-1">(tous les agents)</span>}
      </p>

      {/* Timeline */}
      {filteredFollowUps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun suivi ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent" />

          <div className="space-y-6">
            {filteredFollowUps.map((f) => {
              const Icon = CHANNEL_ICONS[f.channel as keyof typeof CHANNEL_ICONS];
              const typeStyle = TYPE_STYLES[f.type] || TYPE_STYLES.CUSTOM;
              const isOverdue = f.status === "OVERDUE";
              const isDone = f.status === "DONE";

              return (
                <div key={f._id} className="relative pl-14 group">
                  {/* Timeline dot */}
                  <div className="absolute left-3 top-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 rounded-full items-center justify-center ring-4 ring-background transition-all duration-300",
                        isDone ? "bg-green-500" : typeStyle.bg,
                        "group-hover:scale-110"
                      )}
                    >
                      {isDone ? (
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
                      isDone && "opacity-70"
                    )}
                  >
                    {/* Header */}
                    <div className="px-5 py-4 border-b bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge
                            variant="secondary"
                            className={cn("font-semibold px-3 py-1", typeStyle.text, "bg-background")}
                          >
                            {f.type}
                          </Badge>
                          {f.status && (
                            <Badge
                              variant={isDone ? "default" : isOverdue ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {f.status === "PENDING" && "En attente"}
                              {f.status === "DONE" && "Terminé"}
                              {f.status === "OVERDUE" && "En retard"}
                            </Badge>
                          )}
                        </div>
                        {f.reminderAt && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md",
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
                    <div className="px-5 py-4 space-y-3">
                      {/* Title */}
                      {f.title && (
                        <h4 className="font-semibold text-base leading-tight">{f.title}</h4>
                      )}

                      {/* Listing info */}
                      {f.listing?.title && (
                        <p className="text-sm font-medium text-primary">{f.listing.title}</p>
                      )}

                      {/* Client */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>
                          {f.client?.firstName} {f.client?.lastName}
                          {f.client?.referenceCode && (
                            <span className="text-xs ml-1">({f.client.referenceCode})</span>
                          )}
                        </span>
                      </div>

                      {/* Note */}
                      {f.note && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.note}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {isAdmin && f.agent && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground/70">Agent:</span>
                              <Badge variant="outline" className="font-medium">
                                {f.agent.firstname} {f.agent.lastname}
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(f.createdAt)}</span>
                          </div>
                        </div>

                        {f.status === "PENDING" && f._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleMarkDone(f._id!)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Marquer terminé
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
