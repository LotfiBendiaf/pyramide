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

import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"; // optional, for classNames
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
  agents: User[];
}

export function FollowUpForm({ listings, clients, agents }: FollowUpFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(FollowUpSchema),
    defaultValues: {
      type: "COLD",
      status: "PENDING",
      channel: "CALL",
      note: "",
      reminderAt: undefined,
    },
  });

  const router = useRouter();

  const onSubmit = (data: FollowUpFormValues) => {
    startTransition(async () => {
      try {
        const result = await createFollowUp(data);

        if (!result.success) {
          // Attach error to a specific field
          form.setError("title", {
            type: "server",
            message: "Erreur inconnue",
          });
          return;
        }

        toast.success("Suivi créé avec succès");
        router.push(ROUTES.FOLLOWUPS);
      } catch (error) {
        // Global form error
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
                  {listings.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.title}
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
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.lastName} {c.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* AGENT */}
        <FormField
          control={form.control}
          name="agent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TYPE */}
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
                  <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* NOTE */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Détails du suivi..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
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
                          "w-full justify-start text-left",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarSyncIcon className="h-4 w-4 text-muted-foreground" />

                        {field.value
                          ? format(new Date(field.value), "dd/MM/yyyy HH:mm")
                          : "Sélectionner la date et l'heure"}
                      </Button>
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date)}
                    initialFocus
                  />
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
              Création du suivi...
            </>
          ) : (
            "Créer le suivi"
          )}
        </Button>
      </form>
    </Form>
  );
}
