"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { ContactFormValues, contactSchema } from "@/lib/validators/contact";
import { SectionHeader } from "../SectionHeader";
import { submitContactMessage } from "@/lib/actions/contact.action";

export default function ContactSection() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const result = await submitContactMessage(data);

      if (result.success) {
        toast.success("Message envoyé avec succès", {
          description: "Nous vous répondrons dans les plus brefs délais.",
        });
        form.reset();
      } else {
        toast.error("Erreur lors de l'envoi", {
          description: result.error?.message || "Veuillez réessayer plus tard.",
        });
      }
    } catch {
      toast.error("Erreur lors de l’envoi du message");
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-primary/[0.08] bg-third/30 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4">
        <SectionHeader
          title="Parlons de votre projet"
          subtitle="Une question, un bien à vendre ou un nouveau projet ? Notre équipe vous répond avec attention."
          watermark="CONTACT"
          className="mb-12 md:mb-16"
        />

        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-primary/10 bg-background/70 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="flex flex-col bg-primary p-6 text-primary-foreground md:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/45">
              Restons en contact
            </p>
            <h3 className="mt-4 max-w-sm text-2xl font-semibold leading-tight md:text-3xl">
              Un échange simple pour commencer votre projet sereinement.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/60">
              Contactez-nous par téléphone ou par email. Un conseiller prendra
              le temps de comprendre votre besoin et de vous orienter.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-start gap-3 border-b border-primary-foreground/10 pb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-primary-foreground/45">
                    Téléphone
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
                    <a href="tel:0779079706" className="hover:underline">
                      0779 07 97 06
                    </a>
                    <a href="tel:0556510000" className="hover:underline">
                      0556 51 00 00
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-primary-foreground/10 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-primary-foreground/45">
                    Email
                  </p>
                  <a
                    href="mailto:contact@pyramideimmobilier.com"
                    className="break-all font-medium hover:underline"
                  >
                    contact@pyramideimmobilier.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-primary-foreground/45">
                    Agence
                  </p>
                  <p className="font-medium">Oran, Algérie</p>
                </div>
              </div>
            </div>

            <p className="mt-auto pt-10 text-xs leading-5 text-primary-foreground/40">
              Nous vous répondons dans les meilleurs délais pendant nos horaires
              d&apos;ouverture.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex h-full flex-col gap-5 bg-background p-6 md:p-8 lg:p-10"
            >
              <div className="mb-1">
                <h3 className="text-xl font-semibold text-foreground">
                  Envoyez-nous un message
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Remplissez le formulaire et nous reviendrons vers vous.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Votre nom complet"
                          className="h-11 bg-muted/25"
                          {...field}
                        />
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
                        <Input
                          type="email"
                          placeholder="email@exemple.com"
                          className="h-11 bg-muted/25"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+213..."
                      className="h-11 bg-muted/25"
                      {...field}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Message</FormLabel>
                    <FormControl className="flex-1">
                      <Textarea
                        placeholder="Décrivez votre besoin..."
                        className="h-full min-h-[140px] resize-none bg-muted/25"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full gap-2 sm:w-fit sm:px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                {!isSubmitting && <ArrowUpRight className="h-4 w-4" />}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
