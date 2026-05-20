"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PIPELINE_STAGE_UI } from "@/constants/pipeline-ui";
import ROUTES from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface Props {
  counts: { stage: string; count: number }[];
}

export function PipelineBar({ counts }: Props) {
  const searchParams = useSearchParams();
  const activeStage = searchParams.get("stage");
  const activeQualification = searchParams.get("qualification");
  const isAllActive = !activeStage && !activeQualification;

  const countMap = Object.fromEntries(counts.map((c) => [c.stage, c.count]));
  const total =
    countMap.TOTAL ??
    PIPELINE_STAGE_UI.filter(
      (s) => s.value !== "ARCHIVED" && s.value !== "QUALIFIED"
    ).reduce((sum, s) => sum + (countMap[s.value] ?? 0), 0);

  function stageHref(value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("qualification");
    if (value) {
      if (value === "QUALIFIED") {
        params.delete("stage");
        params.set("qualification", "QUALIFIED");
      } else {
        params.set("stage", value);
      }
    } else {
      params.delete("stage");
    }
    return `${ROUTES.CLIENTS_DASHBOARD}?${params.toString()}`;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {/* "Tous" card */}
      <Link
        href={stageHref(undefined)}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-xl border-2 border-t-4 p-3 text-center transition-all hover:shadow-sm",
          isAllActive
            ? "border-primary border-t-primary bg-primary/5"
            : "border-border border-t-border bg-muted/30 hover:bg-muted/60"
        )}
      >
        <Users
          className={cn(
            "h-5 w-5",
            isAllActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-2xl font-bold leading-none",
            isAllActive ? "text-primary" : "text-foreground"
          )}
        >
          {total}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground leading-tight">
          Tous
        </span>
      </Link>

      {/* Stage cards */}
      {PIPELINE_STAGE_UI.map((stage) => {
        const count = countMap[stage.value] ?? 0;
        const isActive =
          stage.value === "QUALIFIED"
            ? activeQualification === "QUALIFIED"
            : activeStage === stage.value;
        const Icon = stage.icon;

        return (
          <Link
            key={stage.value}
            href={stageHref(stage.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 border-t-4 p-3 text-center transition-all hover:shadow-sm",
              isActive
                ? `${stage.topBorder} bg-muted/40 border-border`
                : count === 0
                  ? `${stage.topBorder} border-border bg-muted/10 opacity-50 hover:opacity-70`
                  : `${stage.topBorder} border-border bg-card hover:bg-muted/30`
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isActive
                  ? stage.iconColor
                  : count === 0
                    ? "text-muted-foreground/50"
                    : stage.iconColor
              )}
            />
            <span
              className={cn(
                "text-2xl font-bold leading-none",
                isActive
                  ? stage.countColor
                  : count === 0
                    ? "text-muted-foreground/40"
                    : stage.countColor
              )}
            >
              {count}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium leading-tight",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {stage.shortLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
