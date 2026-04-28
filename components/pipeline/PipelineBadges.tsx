import { Badge } from "@/components/ui/badge";
import {
  PIPELINE_STAGES,
  LISTING_PIPELINE_STAGES,
  CLIENT_TEMPERATURES,
  VISIT_STATUSES,
  VISIT_OUTCOMES,
  NEGOTIATION_STATUSES,
} from "@/constants/values";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function colorToVariant(color: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    secondary: "secondary",
    success: "success",
    warning: "warning",
    destructive: "destructive",
    outline: "outline",
    info: "default",
    default: "default",
  };
  return map[color] ?? "default";
}

export function ClientStageBadge({ stage }: { stage: string }) {
  const config = PIPELINE_STAGES.find((s) => s.value === stage);
  if (!config) return <Badge variant="outline">{stage}</Badge>;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}

export function ListingPipelineBadge({ status }: { status: string }) {
  const config = LISTING_PIPELINE_STAGES.find((s) => s.value === status);
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}

export function TemperatureBadge({ temperature }: { temperature: string }) {
  const config = CLIENT_TEMPERATURES.find((t) => t.value === temperature);
  if (!config) return null;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}

export function VisitStatusBadge({ status }: { status: string }) {
  const config = VISIT_STATUSES.find((s) => s.value === status);
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}

export function VisitOutcomeBadge({ outcome }: { outcome: string }) {
  const config = VISIT_OUTCOMES.find((o) => o.value === outcome);
  if (!config) return null;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}

export function NegotiationStatusBadge({ status }: { status: string }) {
  const config = NEGOTIATION_STATUSES.find((s) => s.value === status);
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant={colorToVariant(config.color)}>{config.label}</Badge>;
}
