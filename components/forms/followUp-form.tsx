"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FollowUpFormValues, FollowUpSchema } from "@/lib/validators/followUp";
import { CalendarSyncIcon, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { createFollowUp } from "@/lib/actions/followUp.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ROUTES from "@/constants/routes";

interface FollowUpFormProps {
  listings: Listing[];
  clients: Client[];
  userRole?: string;
  agents?: User[];
  defaultClientId?: string;
}

export function FollowUpForm({
  listings,
  clients,
  userRole,
  agents = [],
  defaultClientId,
}: FollowUpFormProps) {
  const canAssignAgent =
    userRole === "ADMIN" || userRole === "MANAGER" || userRole === "DEVELOPER";
  const [isPending, startTransition] = useTransition();

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(FollowUpSchema),
    defaultValues: {
      type: "COLD",
      channel: "CALL",
      status: "DONE",
      title: "",
      note: "",
      reminderAt: undefined,
      client: defaultClientId,
    },
  });

  const router = useRouter();

  const onSubmit = (data: FollowUpFormValues) => {
    startTransition(async () => {
      try {
        const status = data.reminderAt ? "PENDING" : "DONE";
        const result = await createFollowUp({
          ...data,
          status,
          listing: data.listing === "AUTRE" ? undefined : data.listing,
          title: data.title || undefined,
        });

        if (!result.success) {
          toast.error("Erreur", {
            description: result.error?.message || "Erreur inconnue",
          });
          return;
        }

        toast.success(
          status === "PENDING" ? "Suivi planifié" : "Suivi ajouté comme terminé"
        );
        router.push(ROUTES.FOLLOWUPS);
      } catch (error) {
        form.setError("root", {
          type: "server",
          message: (error as string) || "Erreur serveur, veuillez réessayer",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* LISTING */}
        <FormField
          control={form.control}
          name="listing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bien immobilier</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un bien" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                  {listings.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.referenceCode || l.title?.slice(0, 60)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CLIENT */}
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.firstName} {c.lastName} — {c.referenceCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* AGENT (admin / manager only) */}
        {canAssignAgent && (
          <FormField
            control={form.control}
            name="agent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent assigné</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.firstname} {a.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* TITLE */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Relance après visite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TYPE + CHANNEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de suivi</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="COLD">Cold</SelectItem>
                    <SelectItem value="WARM">Warm</SelectItem>
                    <SelectItem value="HOT">Hot</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CALL">Appel</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="VISIT">Visite</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Détails du suivi…"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* REMINDER */}
        <FormField
          control={form.control}
          name="reminderAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rappel</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left gap-2",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarSyncIcon className="h-4 w-4 text-muted-foreground" />
                        {field.value
                          ? format(new Date(field.value), "dd/MM/yyyy HH:mm")
                          : "Sélectionner une date et heure"}
                      </Button>
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (!date) return field.onChange(undefined);
                      const prev = field.value ? new Date(field.value) : null;
                      date.setHours(prev?.getHours() ?? 9, prev?.getMinutes() ?? 0, 0, 0);
                      field.onChange(date);
                    }}
                  />
                  <div className="border-t p-3">
                    <label className="text-sm text-muted-foreground mb-1 block">Heure</label>
                    <Input
                      type="time"
                      className="w-full"
                      value={field.value ? format(new Date(field.value), "HH:mm") : "09:00"}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":").map(Number);
                        const date = field.value ? new Date(field.value) : new Date();
                        date.setHours(hours, minutes, 0, 0);
                        field.onChange(new Date(date));
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création du suivi…
            </>
          ) : (
            "Enregistrer le suivi"
          )}
        </Button>
      </form>
    </Form>
  );
}
