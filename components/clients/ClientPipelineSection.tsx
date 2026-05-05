"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemperatureBadge } from "@/components/pipeline/PipelineBadges";
import { setClientPipelineStage } from "@/lib/actions/client.action";
import {
  PIPELINE_STAGE_UI,
  MANUAL_PIPELINE_STAGES,
  getPipelineStageUI,
} from "@/constants/pipeline-ui";
import { Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
  pipelineStage: string;
  clientTemperature?: string;
}

const AUTO_STAGE_MESSAGES: Record<string, string> = {
  IN_NEGOTIATION: "Cette phase est gérée automatiquement par le système de négociation.",
  CLOSED: "Le dossier est clôturé via le système de négociation.",
  ARCHIVED: "Ce client a été archivé suite à une demande approuvée.",
  PHASE_1_REVIEW: "En attente de validation par le manager.",
  PHASE_2_REVIEW: "En cours d'évaluation Phase 2.",
};

export function ClientPipelineSection({
  clientId,
  pipelineStage,
  clientTemperature,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const currentConfig = getPipelineStageUI(pipelineStage);
  const isManualStage = (MANUAL_PIPELINE_STAGES as readonly string[]).includes(
    pipelineStage
  );
  const autoMessage = AUTO_STAGE_MESSAGES[pipelineStage];

  const CurrentIcon = currentConfig?.icon;

  async function handleStageChange(target: (typeof MANUAL_PIPELINE_STAGES)[number]) {
    setLoading(target);
    const result = await setClientPipelineStage(clientId, target);
    setLoading(null);
    if (!result.success) {
      toast.error(result.error?.message ?? "Erreur");
      return;
    }
    const targetConfig = getPipelineStageUI(target);
    toast.success(`Déplacé vers "${targetConfig?.label}"`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pipeline client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current stage badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentConfig ? (
            <span
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold",
                currentConfig.pillActive
              )}
            >
              {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
              {currentConfig.label}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{pipelineStage}</span>
          )}
          {clientTemperature && (
            <TemperatureBadge temperature={clientTemperature} />
          )}
        </div>

        {/* Manual stage transition buttons */}
        {isManualStage && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Changer de phase
            </p>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGE_UI.filter(
                (s) =>
                  (MANUAL_PIPELINE_STAGES as readonly string[]).includes(s.value) &&
                  s.value !== pipelineStage
              ).map((stage) => {
                const Icon = stage.icon;
                const isLoading = loading === stage.value;
                return (
                  <button
                    key={stage.value}
                    onClick={() =>
                      handleStageChange(
                        stage.value as (typeof MANUAL_PIPELINE_STAGES)[number]
                      )
                    }
                    disabled={!!loading}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                      stage.pill,
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-managed stage info */}
        {autoMessage && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{autoMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
