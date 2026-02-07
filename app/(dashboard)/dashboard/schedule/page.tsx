export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { SectionHeader } from "@/components/SectionHeader";
import { getSchedule } from "@/lib/actions/calendar.action";
import ScheduleClient from "./ScheduleClient";

export const metadata = {
  title: "Mon Planning | Pyramide",
  description: "Gérez votre planning quotidien",
};

async function ScheduleContent() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  // Fetch 4 weeks of events (current week + 3 more) to allow navigation to future dates
  const weekEnd = endOfWeek(addWeeks(today, 3), { weekStartsOn: 1 });

  const result = await getSchedule({
    startDate: weekStart,
    endDate: weekEnd,
  });

  const events = result.success ? result.data || [] : [];

  // Calculate stats
  const todayEvents = events.filter(
    (e) =>
      format(new Date(e.startTime), "yyyy-MM-dd") ===
      format(today, "yyyy-MM-dd")
  );

  // Calculate current week events for the "This week" stat
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEvents = events.filter(
    (e) => new Date(e.startTime) <= currentWeekEnd
  );

  const stats = {
    todayCount: todayEvents.length,
    weekCount: thisWeekEvents.length,
    visits: events.filter((e) => e.channel === "VISIT").length,
    calls: events.filter(
      (e) => e.channel === "CALL" || e.channel === "WHATSAPP"
    ).length,
    tasks: events.filter((e) => e.type === "task").length,
    overdue: events.filter((e) => e.status === "OVERDUE").length,
  };

  return <ScheduleClient events={events} stats={stats} />;
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-muted rounded-lg h-20" />
        ))}
      </div>

      {/* Calendar skeleton */}
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="bg-muted rounded-lg h-[300px]" />
        <div className="space-y-4">
          <div className="bg-muted rounded-lg h-16" />
          <div className="bg-muted rounded-lg h-24" />
          <div className="bg-muted rounded-lg h-24" />
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <SectionHeader
              title="Mon Planning"
              subtitle="Gérez vos rendez-vous, visites et tâches"
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
