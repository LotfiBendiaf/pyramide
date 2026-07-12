"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, subDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Phone,
  MapPin,
  ListTodo,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DailySchedule from "@/components/schedule/DailySchedule";
import EventCreationDialog from "@/components/schedule/EventCreationDialog";
import GoogleCalendarConnect from "@/components/schedule/GoogleCalendarConnect";
import {
  ScheduleEvent,
  deleteCalendarEvent,
} from "@/lib/actions/calendar.action";

interface ScheduleClientProps {
  events: ScheduleEvent[];
  stats: {
    todayCount: number;
    weekCount: number;
    visits: number;
    calls: number;
    tasks: number;
    overdue: number;
  };
}

const statCards = [
  {
    key: "todayCount",
    label: "Aujourd'hui",
    icon: Clock,
    color: "text-blue-600 bg-blue-100",
  },
  {
    key: "weekCount",
    label: "Cette semaine",
    icon: CalendarIcon,
    color: "text-purple-600 bg-purple-100",
  },
  {
    key: "visits",
    label: "Visites",
    icon: MapPin,
    color: "text-green-600 bg-green-100",
  },
  {
    key: "calls",
    label: "Appels",
    icon: Phone,
    color: "text-amber-600 bg-amber-100",
  },
  {
    key: "tasks",
    label: "Tâches",
    icon: ListTodo,
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    key: "overdue",
    label: "En retard",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-100",
  },
];

export default function ScheduleClient({ events, stats }: ScheduleClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get dates with events for calendar highlighting
  const datesWithEvents = events.map((e) => new Date(e.startTime));

  const handlePrevDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleMarkComplete = async (id: string) => {
    // This would need a separate action to mark complete
    toast.info(`Marquer l'événement ${id} comme terminé`);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCalendarEvent(id);
    if (result.success) {
      toast.success("Événement supprimé");
      router.refresh();
    } else {
      toast.error(result.error?.message || "Erreur lors de la suppression");
    }
  };

  const handleEventCreated = () => {
    router.refresh();
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof typeof stats];

          return (
            <Card key={stat.key}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold sm:text-2xl">{value}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid min-w-0 gap-4 md:grid-cols-[300px_minmax(0,1fr)] md:gap-6">
        {/* Left Sidebar - Calendar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Calendrier
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-1 sm:p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={fr}
                modifiers={{
                  hasEvent: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "hsl(var(--primary))",
                  },
                }}
                className="max-w-full rounded-md p-2 sm:p-3"
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <EventCreationDialog
                defaultDate={selectedDate}
                onEventCreated={handleEventCreated}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleToday}
              >
                Aller à aujourd&apos;hui
              </Button>
            </CardContent>
          </Card>

          {/* Google Calendar Connection */}
          <GoogleCalendarConnect />
        </div>

        {/* Right Content - Daily Schedule */}
        <Card className="min-w-0">
          <CardHeader className="border-b px-3 pb-3 sm:px-6 sm:pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-medium">Planning</CardTitle>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Jour précédent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToday}
                  className={cn(
                    "min-w-0 flex-1 px-2 sm:flex-none sm:px-3",
                    isToday(selectedDate) &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  Aujourd&apos;hui
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Jour suivant">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <DailySchedule
              events={events}
              selectedDate={selectedDate}
              onMarkComplete={handleMarkComplete}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
