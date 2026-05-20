import {
  UserPlus,
  Snowflake,
  Flame,
  Handshake,
  Trophy,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export interface PipelineStageUI {
  value: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** pill (non-active) Tailwind classes */
  pill: string;
  /** pill (active / selected) Tailwind classes */
  pillActive: string;
  /** colored top border for cards */
  topBorder: string;
  /** icon color class */
  iconColor: string;
  /** large count text color class */
  countColor: string;
}

export const PIPELINE_STAGE_UI: PipelineStageUI[] = [
  {
    value: "QUALIFIED",
    label: "Clients qualifiés",
    shortLabel: "Qualifiés",
    icon: BadgeCheck,
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    pillActive: "bg-emerald-600 text-white border-emerald-600",
    topBorder: "border-t-emerald-500",
    iconColor: "text-emerald-500",
    countColor: "text-emerald-700",
  },
  {
    value: "LEAD",
    label: "Nouveau client",
    shortLabel: "Nouveau",
    icon: UserPlus,
    pill: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
    pillActive: "bg-slate-700 text-white border-slate-700",
    topBorder: "border-t-slate-400",
    iconColor: "text-slate-500",
    countColor: "text-slate-700",
  },
  {
    value: "FOLLOW_UP",
    label: "Recherche froide",
    shortLabel: "Froide",
    icon: Snowflake,
    pill: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    pillActive: "bg-blue-600 text-white border-blue-600",
    topBorder: "border-t-blue-500",
    iconColor: "text-blue-500",
    countColor: "text-blue-700",
  },
  {
    value: "ACTIVE_SEARCH",
    label: "Recherche chaude",
    shortLabel: "Chaude",
    icon: Flame,
    pill: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    pillActive: "bg-orange-500 text-white border-orange-500",
    topBorder: "border-t-orange-500",
    iconColor: "text-orange-500",
    countColor: "text-orange-700",
  },
  {
    value: "IN_NEGOTIATION",
    label: "Négociations",
    shortLabel: "Négos",
    icon: Handshake,
    pill: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    pillActive: "bg-purple-600 text-white border-purple-600",
    topBorder: "border-t-purple-500",
    iconColor: "text-purple-500",
    countColor: "text-purple-700",
  },
  {
    value: "CLOSED",
    label: "Closing",
    shortLabel: "Closing",
    icon: Trophy,
    pill: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    pillActive: "bg-green-600 text-white border-green-600",
    topBorder: "border-t-green-500",
    iconColor: "text-green-500",
    countColor: "text-green-700",
  },
  // {
  //   value: "ARCHIVED",
  //   label: "Archivé",
  //   shortLabel: "Archivé",
  //   icon: Archive,
  //   pill: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200",
  //   pillActive: "bg-gray-500 text-white border-gray-500",
  //   topBorder: "border-t-gray-400",
  //   iconColor: "text-gray-400",
  //   countColor: "text-gray-500",
  // },
];

export const MANUAL_PIPELINE_STAGES = [
  "LEAD",
  "FOLLOW_UP",
  "ACTIVE_SEARCH",
] as const;

export function getPipelineStageUI(value: string): PipelineStageUI | undefined {
  return PIPELINE_STAGE_UI.find((s) => s.value === value);
}
