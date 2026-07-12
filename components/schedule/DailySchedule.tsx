"use client";

import { format, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarX } from "lucide-react";
import ScheduleEventCard from "./ScheduleEventCard";
import { ScheduleEvent } from "@/lib/actions/calendar.action";

interface DailyScheduleProps {
  events: ScheduleEvent[];
  selectedDate: Date;
  onMarkComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DailySchedule({
  events,
  selectedDate,
  onMarkComplete,
  onDelete,
}: DailyScheduleProps) {
  // Filter events for the selected date
  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.startTime), selectedDate)
  );

  // Group events by hour
  const eventsByHour: Record<number, ScheduleEvent[]> = {};
  dayEvents.forEach((event) => {
    const hour = new Date(event.startTime).getHours();
    if (!eventsByHour[hour]) {
      eventsByHour[hour] = [];
    }
    eventsByHour[hour].push(event);
  });

  const hours = Object.keys(eventsByHour)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center gap-2 border-b pb-4 sm:gap-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "EEEE", { locale: fr })}
          </p>
          <p className="text-2xl font-bold sm:text-3xl">{format(selectedDate, "d")}</p>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "MMMM yyyy", { locale: fr })}
          </p>
        </div>
        {isToday(selectedDate) && (
          <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            Aujourd&apos;hui
          </span>
        )}
        <div className="ml-auto shrink-0 text-right">
          <p className="text-xl font-semibold sm:text-2xl">{dayEvents.length}</p>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length === 1 ? "événement" : "événements"}
          </p>
        </div>
      </div>

      {/* Events */}
      {dayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Aucun événement prévu
          </p>
          <p className="text-sm text-muted-foreground">
            Votre journée est libre
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {hours.map((hour) => (
            <div key={hour} className="relative">
              {/* Hour marker */}
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium text-muted-foreground w-12">
                  {hour.toString().padStart(2, "0")}:00
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Events for this hour */}
              <div className="space-y-3 sm:pl-16">
                {eventsByHour[hour].map((event) => (
                  <ScheduleEventCard
                    key={event._id}
                    event={event}
                    onMarkComplete={onMarkComplete}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
