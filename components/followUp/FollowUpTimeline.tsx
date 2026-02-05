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
} from "lucide-react";

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

export function FollowUpTimeline({
  followUps,
}: {
  followUps: FollowUp[];
}) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent" />

      <div className="space-y-8">
        {followUps.map((f, index) => {
          const Icon = CHANNEL_ICONS[f.channel as keyof typeof CHANNEL_ICONS];
          const typeStyle = TYPE_STYLES[f.type];
          const isOverdue = f.status === "OVERDUE";

          return (
            <div key={f._id} className="relative pl-14 group">
              {/* Timeline dot with pulse effect */}
              <div className="absolute left-3 top-3">
                <span
                  className={cn(
                    "flex h-6 w-6 rounded-full items-center justify-center ring-4 ring-background transition-all duration-300",
                    typeStyle.bg,
                    "group-hover:scale-110"
                  )}
                >
                  {Icon && <Icon className="h-3 w-3 text-white" />}
                </span>
                {index !== followUps.length - 1 && (
                  <span className="absolute left-1/2 top-full h-8 w-px bg-border -translate-x-1/2" />
                )}
              </div>

              {/* Card */}
              <div
                className={cn(
                  "rounded-xl border bg-card transition-all duration-300",
                  "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
                  isOverdue && "border-destructive/30 bg-destructive/5"
                )}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-semibold px-3 py-1",
                          typeStyle.text,
                          "bg-background"
                        )}
                      >
                        {f.type}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {f.client?.firstName} {f.client?.lastName}
                        </span>
                      </div>
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
                  {f.listing.title && (
                    <h4 className="font-semibold text-base leading-tight">
                      {f.listing.title}
                    </h4>
                  )}

                  {f.note && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.note}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/70">
                        Suivie par:
                      </span>
                      <Badge variant="outline" className="font-medium">
                        {f.agent?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(f.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
