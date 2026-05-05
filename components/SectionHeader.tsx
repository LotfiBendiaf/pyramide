"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  buttonTarget?: string;
  action?: React.ReactNode;
  watermark?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  buttonTarget,
  action,
  watermark = "PYRAMIDE",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("relative mb-16", className)}>
      {/* MAIN HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-20">
        <div className="space-y-2 px-2 md:px-6">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif syncopate tracking-tight">
            {title}
          </h2>

          {subtitle && (
            <p className="text-muted-foreground max-w-lg text-lg">{subtitle}</p>
          )}
        </div>

        {action ?? (buttonLabel && buttonHref && (
          <Link href={buttonHref} target={buttonTarget} rel={buttonTarget === "_blank" ? "noopener noreferrer" : undefined}>
            <Button variant="outline" className="hidden md:flex gap-2">
              {buttonLabel} <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        ))}
      </div>

      {/* Watermark */}
      {watermark && (
        <div
          className="absolute top-0 left-0 -z-10 pointer-events-none select-none opacity-10"
          aria-hidden="true"
        >
          <span className="font-serif text-[3.5rem] md:text-[6rem] lg:text-[10rem] leading-none tracking-wider whitespace-nowrap">
            {watermark}
          </span>
        </div>
      )}
    </div>
  );
}
