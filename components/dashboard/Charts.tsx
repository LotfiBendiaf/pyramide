"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartsData {
  salesData: Array<{ month: string; sales: number; revenue: number }>;
  propertyTypeData: Array<{ type: string; count: number }>;
  clientStatusData: Array<{ status: string; count: number }>;
}

interface DashboardChartsProps {
  data: ChartsData;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
];

const STATUS_COLORS: Record<string, string> = {
  NEW: COLORS.info,
  QUALIFIED: COLORS.success,
  NOT_RELEVANT: COLORS.danger,
  ARCHIVED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  QUALIFIED: "Qualifié",
  NOT_RELEVANT: "Non pertinent",
  ARCHIVED: "Archivé",
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  const { salesData, propertyTypeData, clientStatusData } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sales Trend Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tendance des Ventes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ventes et revenus des 6 derniers mois
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.primary}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.primary}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.success}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.success}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "revenue") {
                    return [`${value.toFixed(2)}M DA`, "Revenu"];
                  }
                  return [value, "Ventes"];
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={COLORS.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Ventes"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.success}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenu (M DA)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Property Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Annonces par Type</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution des propriétés
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bar">Barres</TabsTrigger>
              <TabsTrigger value="pie">Circulaire</TabsTrigger>
            </TabsList>

            <TabsContent value="bar">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="type"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="pie">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) =>
                      `${type} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {propertyTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Client Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Clients par Statut</CardTitle>
          <p className="text-sm text-muted-foreground">État de qualification</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={clientStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis
                dataKey="status"
                type="category"
                stroke="#6b7280"
                fontSize={12}
                width={100}
                tickFormatter={(value) => STATUS_LABELS[value] || value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props) => [
                  value,
                  STATUS_LABELS[props.payload.status] || props.payload.status,
                ]}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {clientStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || COLORS.secondary}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
