"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateClientQualification } from "@/lib/actions/client.action";
import { CLIENT_QUALIFICATIONS, ClientQualification } from "@/constants/values";
import { cn } from "@/lib/utils";

type Props = {
  clientId: string;
  value: ClientQualification;
};

const DOT_COLORS: Record<ClientQualification, string> = {
  NEW: "bg-blue-500",
  QUALIFIED: "bg-green-500",
  NOT_RELEVANT: "bg-yellow-500",
  ARCHIVED: "bg-gray-400",
};

export default function ClientQualificationSelect({ clientId, value }: Props) {
  const handleChange = async (newValue: ClientQualification) => {
    const result = await updateClientQualification(clientId, newValue);

    if (!result.success) {
      toast.error("Erreur", {
        description: result.error?.message as string,
      });
      return;
    }

    toast.success("Statut mis à jour");
  };

  const currentLabel = CLIENT_QUALIFICATIONS.find((q) => q.value === value)?.label;

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[150px] h-8">
        <span className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[value])} />
          {currentLabel}
        </span>
      </SelectTrigger>

      <SelectContent>
        {CLIENT_QUALIFICATIONS.map((q) => (
          <SelectItem key={q.value} value={q.value}>
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[q.value])} />
              {q.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
