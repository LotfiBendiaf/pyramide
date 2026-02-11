"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTimeAgo } from "@/lib/utils";
import {
  Building2,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Activity {
  type: "listing" | "client" | "followup" | "sale";
  title: string;
  description: string;
  timestamp: Date | string;
  user: {
    name: string;
    profileImage?: string;
  };
  isLate?: boolean;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons: Record<Activity["type"], LucideIcon> = {
  listing: Building2,
  client: UserPlus,
  followup: Calendar,
  sale: CheckCircle2,
};

const activityColors: Record<Activity["type"], string> = {
  listing: "bg-blue-500/10 text-blue-600 border-blue-200",
  client: "bg-green-500/10 text-green-600 border-green-200",
  followup: "bg-orange-500/10 text-orange-600 border-orange-200",
  sale: "bg-purple-500/10 text-purple-600 border-purple-200",
};

const activityLabels: Record<Activity["type"], string> = {
  listing: "Annonce",
  client: "Client",
  followup: "Suivi",
  sale: "Vente",
};

function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = activityIcons[activity.type];

  return (
    <div className="flex items-start gap-4 py-4 group border-b last:border-0">
      {/* Icon */}
      <div
        className={cn(
          "rounded-full p-2.5 border transition-transform group-hover:scale-110",
          activityColors[activity.type]
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-medium leading-tight">
                {activity.title}
              </p>
              <Badge variant="secondary" className="text-xs">
                {activityLabels[activity.type]}
              </Badge>
              {activity.isLate && (
                <Badge
                  variant="destructive"
                  className="text-xs flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {activity.description}
            </p>
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {getTimeAgo(activity.timestamp)}
          </time>
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={activity.user.profileImage} />
            <AvatarFallback className="text-[10px] bg-muted">
              {activity.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {activity.user.name}
          </span>
        </div>
      </div>
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const [filter, setFilter] = useState<"all" | "late">("all");

  const filteredActivities =
    filter === "late"
      ? activities.filter((activity) => activity.isLate)
      : activities;

  const lateCount = activities.filter((activity) => activity.isLate).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activité Récente</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les dernières actions dans votre CRM
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Tout
            </Button>
            <Button
              variant={filter === "late" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilter("late")}
              className="gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              En retard
              {lateCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {lateCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length > 0 ? (
          <div className="space-y-0">
            {filteredActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {filter === "late"
                ? "Aucune activité en retard"
                : "Aucune activité récente"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
