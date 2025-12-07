"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "Un graphique interactif de l'activité immobilière";

// Real Estate Data: New Mandates (Nouveaux Mandats) and Client Leads (Leads Clients)
const chartData = [
  { date: "2024-04-01", mandates: 5, leads: 15 },
  { date: "2024-04-02", mandates: 3, leads: 18 },
  { date: "2024-04-03", mandates: 6, leads: 12 },
  { date: "2024-04-04", mandates: 8, leads: 26 },
  { date: "2024-04-05", mandates: 12, leads: 29 },
  { date: "2024-04-06", mandates: 10, leads: 34 },
  { date: "2024-04-07", mandates: 7, leads: 18 },
  { date: "2024-04-08", mandates: 15, leads: 32 },
  { date: "2024-04-09", mandates: 4, leads: 11 },
  { date: "2024-04-10", mandates: 8, leads: 19 },
  { date: "2024-04-11", mandates: 11, leads: 35 },
  { date: "2024-04-12", mandates: 9, leads: 21 },
  { date: "2024-04-13", mandates: 10, leads: 38 },
  { date: "2024-04-14", mandates: 4, leads: 22 },
  { date: "2024-04-15", mandates: 5, leads: 17 },
  { date: "2024-04-16", mandates: 6, leads: 19 },
  { date: "2024-04-17", mandates: 14, leads: 36 },
  { date: "2024-04-18", mandates: 12, leads: 41 },
  { date: "2024-04-19", mandates: 7, leads: 18 },
  { date: "2024-04-20", mandates: 3, leads: 15 },
  { date: "2024-04-21", mandates: 4, leads: 20 },
  { date: "2024-04-22", mandates: 7, leads: 17 },
  { date: "2024-04-23", mandates: 5, leads: 23 },
  { date: "2024-04-24", mandates: 12, leads: 29 },
  { date: "2024-04-25", mandates: 6, leads: 25 },
  { date: "2024-04-26", mandates: 3, leads: 13 },
  { date: "2024-04-27", mandates: 13, leads: 42 },
  { date: "2024-04-28", mandates: 4, leads: 18 },
  { date: "2024-04-29", mandates: 10, leads: 24 },
  { date: "2024-04-30", mandates: 15, leads: 38 },
  { date: "2024-05-01", mandates: 6, leads: 22 },
  { date: "2024-05-02", mandates: 9, leads: 31 },
  { date: "2024-05-03", mandates: 7, leads: 19 },
  { date: "2024-05-04", mandates: 12, leads: 42 },
  { date: "2024-05-05", mandates: 14, leads: 39 },
  { date: "2024-05-06", mandates: 16, leads: 52 },
  { date: "2024-05-07", mandates: 12, leads: 30 },
  { date: "2024-05-08", mandates: 5, leads: 21 },
  { date: "2024-05-09", mandates: 7, leads: 18 },
  { date: "2024-05-10", mandates: 9, leads: 33 },
  { date: "2024-05-11", mandates: 11, leads: 27 },
  { date: "2024-05-12", mandates: 6, leads: 24 },
  { date: "2024-05-13", mandates: 6, leads: 16 },
  { date: "2024-05-14", mandates: 14, leads: 49 },
  { date: "2024-05-15", mandates: 15, leads: 38 },
  { date: "2024-05-16", mandates: 11, leads: 40 },
  { date: "2024-05-17", mandates: 16, leads: 42 },
  { date: "2024-05-18", mandates: 10, leads: 35 },
  { date: "2024-05-19", mandates: 7, leads: 18 },
  { date: "2024-05-20", mandates: 6, leads: 23 },
  { date: "2024-05-21", mandates: 3, leads: 14 },
  { date: "2024-05-22", mandates: 3, leads: 12 },
  { date: "2024-05-23", mandates: 8, leads: 29 },
  { date: "2024-05-24", mandates: 9, leads: 22 },
  { date: "2024-05-25", mandates: 6, leads: 25 },
  { date: "2024-05-26", mandates: 6, leads: 17 },
  { date: "2024-05-27", mandates: 13, leads: 46 },
  { date: "2024-05-28", mandates: 7, leads: 19 },
  { date: "2024-05-29", mandates: 3, leads: 13 },
  { date: "2024-05-30", mandates: 11, leads: 28 },
  { date: "2024-05-31", mandates: 6, leads: 23 },
  { date: "2024-06-01", mandates: 6, leads: 20 },
  { date: "2024-06-02", mandates: 15, leads: 41 },
  { date: "2024-06-03", mandates: 4, leads: 16 },
  { date: "2024-06-04", mandates: 14, leads: 38 },
  { date: "2024-06-05", mandates: 3, leads: 14 },
  { date: "2024-06-06", mandates: 9, leads: 25 },
  { date: "2024-06-07", mandates: 10, leads: 37 },
  { date: "2024-06-08", mandates: 12, leads: 32 },
  { date: "2024-06-09", mandates: 14, leads: 48 },
  { date: "2024-06-10", mandates: 5, leads: 20 },
  { date: "2024-06-11", mandates: 3, leads: 15 },
  { date: "2024-06-12", mandates: 16, leads: 42 },
  { date: "2024-06-13", mandates: 3, leads: 13 },
  { date: "2024-06-14", mandates: 13, leads: 38 },
  { date: "2024-06-15", mandates: 10, leads: 35 },
  { date: "2024-06-16", mandates: 12, leads: 31 },
  { date: "2024-06-17", mandates: 15, leads: 52 },
  { date: "2024-06-18", mandates: 4, leads: 17 },
  { date: "2024-06-19", mandates: 11, leads: 29 },
  { date: "2024-06-20", mandates: 13, leads: 45 },
  { date: "2024-06-21", mandates: 5, leads: 21 },
  { date: "2024-06-22", mandates: 10, leads: 27 },
  { date: "2024-06-23", mandates: 15, leads: 53 },
  { date: "2024-06-24", mandates: 4, leads: 18 },
  { date: "2024-06-25", mandates: 5, leads: 19 },
  { date: "2024-06-26", mandates: 14, leads: 38 },
  { date: "2024-06-27", mandates: 14, leads: 49 },
  { date: "2024-06-28", mandates: 5, leads: 20 },
  { date: "2024-06-29", mandates: 4, leads: 16 },
  { date: "2024-06-30", mandates: 14, leads: 40 },
];

const chartConfig = {
  activity: {
    label: "Activité",
  },
  leads: {
    label: "Leads Clients",
    color: "var(--primary)", // Primary color (e.g., blue)
  },
  mandates: {
    label: "Nouveaux Mandats",
    color: "orange", // Secondary color (e.g., orange/yellow)
  },
} satisfies ChartConfig;

export function Chart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Flux de l&apos;Activité Immobilière</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Nouveaux mandats et leads clients sur les 3 derniers mois
          </span>
          <span className="@[540px]/card:hidden">Derniers 3 mois</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 derniers mois</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 derniers jours</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 derniers jours</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Sélectionner une période"
            >
              <SelectValue placeholder="3 derniers mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 derniers mois
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 derniers jours
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 derniers jours
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {/* Note: Updated IDs to match new data keys (mandates/leads) */}
              <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMandates" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                // Keeping 'en-US' locale for chart compatibility, but showing date format
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {/* Leads Clients (stacked first, usually the larger volume) */}
            <Area
              dataKey="leads"
              type="natural"
              fill="url(#fillLeads)"
              stroke="hsl(var(--chart-1))"
              stackId="a"
            />
            {/* Nouveaux Mandats (stacked second, usually the smaller volume) */}
            <Area
              dataKey="mandates"
              type="natural"
              fill="url(#fillMandates)"
              stroke="hsl(var(--chart-2))"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
