"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PIPELINE_STAGES } from "@/constants/values";
import ROUTES from "@/constants/routes";
import { cn } from "@/lib/utils";

const DISPLAYED_STAGES = PIPELINE_STAGES.filter(
  (s) => s.value !== "ARCHIVED"
);

interface Props {
  counts: { stage: string; count: number }[];
}

export function PipelineBar({ counts }: Props) {
  const searchParams = useSearchParams();
  const activeStage = searchParams.get("stage");

  const countMap = Object.fromEntries(counts.map((c) => [c.stage, c.count]));
  const total = counts
    .filter((c) => c.stage !== "CLOSED")
    .reduce((sum, c) => sum + c.count, 0);

  function stageHref(value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) {
      params.set("stage", value);
    } else {
      params.delete("stage");
    }
    return `${ROUTES.CLIENTS_DASHBOARD}?${params.toString()}`;
  }

  return (
    <div className="space-y-2">
      {/* Stage pills */}
      <div className="flex items-stretch gap-0 rounded-lg border overflow-hidden">
        {/* "Tous" pill */}
        <Link
          href={stageHref(undefined)}
          className={cn(
            "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors min-w-[64px] border-r",
            !activeStage
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="text-base font-bold leading-none">{total}</span>
          <span className="mt-0.5 whitespace-nowrap">Tous</span>
        </Link>

        {DISPLAYED_STAGES.map((stage, i) => {
          const count = countMap[stage.value] ?? 0;
          const isActive = activeStage === stage.value;
          const isLast = i === DISPLAYED_STAGES.length - 1;

          return (
            <Link
              key={stage.value}
              href={stageHref(stage.value)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors flex-1 min-w-0",
                !isLast && "border-r",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : count === 0
                  ? "bg-muted/20 text-muted-foreground/50 hover:bg-muted/40"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-base font-bold leading-none">{count}</span>
              <span className="mt-0.5 truncate w-full text-center leading-tight">
                {stage.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
