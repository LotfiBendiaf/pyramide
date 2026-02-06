"use client";

import { format } from "date-fns";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Home,
  MoreVertical,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleEvent } from "@/lib/actions/calendar.action";

interface ScheduleEventCardProps {
  event: ScheduleEvent;
  onMarkComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeConfig = {
  followup: {
    label: "Suivi",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Phone,
  },
  task: {
    label: "Tâche",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: CheckCircle2,
  },
  event: {
    label: "Événement",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Calendar,
  },
};

const channelConfig: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  CALL: { label: "Appel", icon: Phone },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  EMAIL: { label: "Email", icon: Mail },
  VISIT: { label: "Visite", icon: MapPin },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Basse", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Moyenne", color: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Haute", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  PENDING: { label: "En attente", icon: Clock, color: "text-gray-500" },
  OVERDUE: { label: "En retard", icon: AlertTriangle, color: "text-red-500" },
  IN_PROGRESS: { label: "En cours", icon: Clock, color: "text-blue-500" },
};

export default function ScheduleEventCard({
  event,
  onMarkComplete,
  onDelete,
}: ScheduleEventCardProps) {
  const config = typeConfig[event.type];
  const TypeIcon = config.icon;
  const channelInfo = event.channel ? channelConfig[event.channel] : null;
  const ChannelIcon = channelInfo?.icon;
  const priorityInfo = event.priority ? priorityConfig[event.priority] : null;
  const statusInfo = event.status ? statusConfig[event.status] : null;
  const StatusIcon = statusInfo?.icon;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-lg p-4 hover:shadow-md transition-shadow",
        event.status === "OVERDUE" && "border-red-300 bg-red-50/50"
      )}
    >
      {/* Time and badges row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">
            {format(startTime, "HH:mm")}
          </span>
          <span className="text-muted-foreground">-</span>
          <span className="text-sm text-muted-foreground">
            {format(endTime, "HH:mm")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {statusInfo && StatusIcon && (
            <Badge variant="outline" className={cn("gap-1", statusInfo.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          )}

          {/* Type badge */}
          <Badge variant="outline" className={cn("gap-1", config.color)}>
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </Badge>

          {/* Channel badge */}
          {channelInfo && ChannelIcon && (
            <Badge variant="secondary" className="gap-1">
              <ChannelIcon className="h-3 w-3" />
              {channelInfo.label}
            </Badge>
          )}

          {/* Priority badge */}
          {priorityInfo && (
            <Badge className={cn(priorityInfo.color)}>
              {priorityInfo.label}
            </Badge>
          )}

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMarkComplete && (
                <DropdownMenuItem onClick={() => onMarkComplete(event._id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer terminé
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(event._id)}
                  className="text-red-600"
                >
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-foreground mb-2">{event.title}</h3>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Details row */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {/* Client */}
        {event.client && (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>
              {event.client.firstName} {event.client.lastName}
            </span>
            {event.client.phone && (
              <a
                href={`tel:${event.client.phone}`}
                className="text-primary hover:underline ml-1"
              >
                {event.client.phone}
              </a>
            )}
          </div>
        )}

        {/* Listing */}
        {event.listing && (
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>{event.listing.title}</span>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Sync status indicator */}
        {event.syncStatus && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              event.syncStatus === "SYNCED" && "text-green-600",
              event.syncStatus === "PENDING" && "text-yellow-600",
              event.syncStatus === "FAILED" && "text-red-600"
            )}
          >
            <Calendar className="h-3 w-3" />
            {event.syncStatus === "SYNCED" && "Synchronisé"}
            {event.syncStatus === "PENDING" && "En attente de sync"}
            {event.syncStatus === "FAILED" && "Échec de sync"}
          </div>
        )}
      </div>
    </div>
  );
}
