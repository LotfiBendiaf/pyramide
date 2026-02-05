"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { updateClient } from "@/lib/actions/client.action";
import { updateClientSchema } from "@/lib/validators/client";
import { ClientType } from "@/models/client.model";
import { CLIENT_QUALIFICATIONS, WILAYAS } from "@/constants/values";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientEditFormValues = z.infer<typeof updateClientSchema>;

interface ClientEditFormProps {
  client: Client;
  userRole?: string;
  agents?: User[];
}

export default function ClientEditForm({
  client,
  userRole,
  agents = [],
}: ClientEditFormProps) {
  const router = useRouter();
  const canAssignAgent = userRole === "ADMIN" || userRole === "MANAGER";

  const form = useForm<ClientEditFormValues>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      type: client.type,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || "",
      city: client.city || "",
      budgetMin: client.budgetMin,
      budgetMax: client.budgetMax,
      qualificationStatus: client.qualificationStatus,
      qualificationNotes: client.qualificationNotes || "",
      assignedAgent: client.assignedAgent?._id || "",
    },
  });

  const onSubmit = async (values: ClientEditFormValues) => {
    const result = await updateClient(client._id, {
      ...values,
      email: values.email || undefined,
      qualificationNotes: values.qualificationNotes || undefined,
      assignedAgent: values.assignedAgent || undefined,
    });

    if (!result.success) {
      toast.error("Erreur", { description: result.error?.message });
      return;
    }

    toast.success("Client mis à jour", {
      description: "Les modifications ont été sauvegardées.",
    });

    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email (optionnel)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de client</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as ClientType)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BUYER">Acheteur</SelectItem>
                    <SelectItem value="SELLER">Vendeur</SelectItem>
                    <SelectItem value="RENTER">Loueur</SelectItem>
                    <SelectItem value="INVESTOR">Investisseur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WILAYAS.map((wilaya) => (
                      <SelectItem key={wilaya} value={wilaya}>
                        {wilaya}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="qualificationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualification</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CLIENT_QUALIFICATIONS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Agent assignment (admin/manager only) */}
        {canAssignAgent && (
          <FormField
            control={form.control}
            name="assignedAgent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent assigné</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent._id} value={agent._id}>
                        {agent.firstname} {agent.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget minimum</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget maximum</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="qualificationNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes sur le client…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Mettre à jour
        </Button>
      </form>
    </Form>
  );
}
