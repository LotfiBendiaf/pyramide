"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ROUTES from "@/constants/routes";
import { requestPasswordReset } from "@/lib/actions/auth.action";
import { ForgotPasswordSchema } from "@/lib/validators/auth";

const SUCCESS_MESSAGE =
  "If an account exists with this email, a reset link has been sent.";

export default function ForgotPasswordForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (data: z.infer<typeof ForgotPasswordSchema>) => {
    setSuccessMessage("");
    const result = await requestPasswordReset(data);

    if (result.success) {
      const message =
        typeof result.data === "string" ? result.data : SUCCESS_MESSAGE;
      setSuccessMessage(message);
      toast.success("Email envoyé", { description: message });
      form.reset();
      return;
    }

    toast.error(`Erreur ${result.status ?? ""}`, {
      description: result.error?.message,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="mail@exemple.com"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {successMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {successMessage}
          </div>
        ) : null}

        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              Envoi...
              <LoaderCircle className="ml-2 h-5 w-5 animate-spin" />
            </>
          ) : (
            "Envoyer le lien"
          )}
        </Button>

        <Link
          href={ROUTES.SIGN_IN}
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </form>
    </Form>
  );
}
