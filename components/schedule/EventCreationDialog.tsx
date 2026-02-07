"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createManualEvent } from "@/lib/actions/calendar.action";

const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  date: z.date({ required_error: "La date est requise" }),
  startTime: z.string().min(1, "L'heure de début est requise"),
  endTime: z.string().min(1, "L'heure de fin est requise"),
  location: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventCreationDialogProps {
  defaultDate?: Date;
  onEventCreated?: () => void;
}

export default function EventCreationDialog({
  defaultDate = new Date(),
  onEventCreated,
}: EventCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: defaultDate,
      startTime: format(new Date(), "HH:00"),
      endTime: format(addHours(new Date(), 1), "HH:00"),
      location: "",
    },
  });

  // Update form date when selectedDate changes
  useEffect(() => {
    form.setValue("date", defaultDate);
  }, [defaultDate, form]);

  const onSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);

    try {
      // Parse times
      const [startHour, startMin] = values.startTime.split(":").map(Number);
      const [endHour, endMin] = values.endTime.split(":").map(Number);

      const startTime = new Date(values.date);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(values.date);
      endTime.setHours(endHour, endMin, 0, 0);

      if (endTime <= startTime) {
        toast.error("L'heure de fin doit être après l'heure de début");
        setIsSubmitting(false);
        return;
      }

      console.log("Submitting event:", {
        title: values.title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      const result = await createManualEvent({
        title: values.title,
        description: values.description || undefined,
        startTime,
        endTime,
        location: values.location || undefined,
      });

      console.log("Create event result:", result);

      if (result.success) {
        toast.success("Événement créé avec succès");
        form.reset();
        setOpen(false);
        onEventCreated?.();
      } else {
        toast.error(result.error?.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un événement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'événement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de l'événement"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de début</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse ou lieu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer l'événement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
