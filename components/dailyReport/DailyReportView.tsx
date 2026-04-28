"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  CheckCircle2,
  MapPin,
  Save,
  Loader2,
  CalendarCheck,
  Handshake,
  Trophy,
  LucideIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface DailyReportData {
  _id?: string;
  agent: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  date: Date | string;
  newClientsCount: number;
  propertiesVisitedCount: number;
  followUpsCompletedCount: number;
  tasksCompletedCount: number;
  visitsScheduledCount?: number;
  visitsCompletedCount?: number;
  negotiationsOpenedCount?: number;
  dealsClosedCount?: number;
  notes?: string;
  newClients?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    type: string;
  }>;
  propertiesVisited?: Array<{
    _id: string;
    title?: string;
    channel: string;
    type: string;
  }>;
  followUpsCompleted?: Array<{
    _id: string;
    title?: string;
    type: string;
    status: string;
  }>;
  tasksCompleted?: Array<{
    _id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
  }>;
}

interface DailyReportViewProps {
  report: DailyReportData;
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "info" | "warning";
}) {
  const variantStyles = {
    default: "border-border bg-card",
    success: "border-green-200",
    info: "border-blue-200",
    warning: "border-orange-200",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    info: "bg-blue-500/10 text-blue-600",
    warning: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-4xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={cn("rounded-full p-3", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyReportView({ report }: DailyReportViewProps) {
  const [notes, setNotes] = useState(report.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: report.date,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notes enregistrées avec succès");
      } else {
        throw new Error(data.error?.message || "Erreur");
      }
    } catch (error) {
      toast.error((error as string) || "Impossible d'enregistrer les notes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{formatDate(report.date)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Résumé de votre activité quotidienne
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Nouveaux Clients"
          value={report.newClientsCount}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Propriétés Visitées"
          value={report.propertiesVisitedCount}
          icon={MapPin}
          variant="info"
        />
        <StatCard
          title="Suivis Complétés"
          value={report.followUpsCompletedCount}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Tâches Complétées"
          value={report.tasksCompletedCount}
          icon={CheckCircle2}
          variant="default"
        />
        <StatCard
          title="Visites Planifiées"
          value={report.visitsScheduledCount ?? 0}
          icon={CalendarCheck}
          variant="info"
        />
        <StatCard
          title="Visites Effectuées"
          value={report.visitsCompletedCount ?? 0}
          icon={CalendarCheck}
          variant="success"
        />
        <StatCard
          title="Négociations Ouvertes"
          value={report.negotiationsOpenedCount ?? 0}
          icon={Handshake}
          variant="warning"
        />
        <StatCard
          title="Affaires Conclues"
          value={report.dealsClosedCount ?? 0}
          icon={Trophy}
          variant="success"
        />
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Clients */}
        {report.newClients && report.newClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nouveaux Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.newClients.map((client) => (
                  <div
                    key={client._id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-muted-foreground">
                          {client.phone}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{client.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Visited */}
        {report.propertiesVisited && report.propertiesVisited.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Propriétés Visitées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.propertiesVisited.map((visit) => (
                  <div
                    key={visit._id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {visit.title || "Visite de propriété"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: {visit.type}
                      </p>
                    </div>
                    <Badge variant="outline">{visit.channel}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Follow-ups Completed */}
        {report.followUpsCompleted && report.followUpsCompleted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Suivis Complétés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.followUpsCompleted.map((followUp) => (
                  <div
                    key={followUp._id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{followUp.title || "Suivi"}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {followUp.type}
                      </p>
                    </div>
                    <Badge
                      variant={
                        followUp.status === "DONE" ? "default" : "secondary"
                      }
                    >
                      {followUp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Completed */}
        {report.tasksCompleted && report.tasksCompleted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Tâches Complétées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.tasksCompleted.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        task.priority === "URGENT" ? "destructive" : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes Additionnelles</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajoutez des observations, remarques ou informations importantes sur
            votre journée
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Entrez vos notes ici..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveNotes} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les Notes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
