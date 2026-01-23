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

type Props = {
  clientId: string;
  value: ClientQualification;
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

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] h-8">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {CLIENT_QUALIFICATIONS.map((q) => (
          <SelectItem key={q.value} value={q.value}>
            {q.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
