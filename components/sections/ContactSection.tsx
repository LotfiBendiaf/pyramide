"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";

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

  const onSubmit = async (data: ContactFormValues) => {
    try {
      console.log(data); // server action later
      toast.success("Message envoyé avec succès");
      form.reset();
    } catch {
      toast.error("Erreur lors de l’envoi du message");
    }
  };

  return (
    <section id="contact" className="py-20 bg-muted/30 rounded-2xl mb-10">
      <div className="container px-5 mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <SectionHeader
            title="Contactez-nous"
            subtitle="Nous vous accompagnons dans tous vos projets immobiliers."
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* Left Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Parlons de votre projet</h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <Phone className="text-blue-600" />
                +213 00 00 00 00
              </div>

              <div className="flex items-center gap-4">
                <Mail className="text-blue-600" />
                contact@pyramideimmobilier.com
              </div>

              <div className="flex items-center gap-4">
                <MapPin className="text-blue-600" />
                Oran, Algérie
              </div>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="bg-background rounded-2xl shadow-md p-6 space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom complet" {...field} />
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
                      <Input placeholder="+213..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre besoin..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Envoyer le message
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
