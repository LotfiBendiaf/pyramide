"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { resetPassword } from "@/lib/actions/auth.action";
import { ResetPasswordSchema } from "@/lib/validators/auth";

interface ResetPasswordFormProps {
  token: string;
  isTokenValid: boolean;
  tokenError?: string;
}

export default function ResetPasswordForm({
  token,
  isTokenValid,
  tokenError,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof ResetPasswordSchema>) => {
    const result = await resetPassword(data);

    if (result.success) {
      toast.success("Mot de passe modifié", {
        description: "Vous pouvez maintenant vous connecter.",
      });
      router.push(ROUTES.SIGN_IN);
      return;
    }

    toast.error(`Erreur ${result.status ?? ""}`, {
      description: result.error?.message,
    });
  };

  if (!isTokenValid) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {tokenError ||
            "Ce lien de réinitialisation est invalide ou a expiré."}
        </div>
        <Button asChild>
          <Link href={ROUTES.FORGOT_PASSWORD}>Demander un nouveau lien</Link>
        </Button>
        <Link
          href={ROUTES.SIGN_IN}
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5"
      >
        <input type="hidden" {...form.register("token")} />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">
                Nouveau mot de passe
              </FormLabel>
              <FormControl>
                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">
                Confirmer le mot de passe
              </FormLabel>
              <FormControl>
                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              Modification...
              <LoaderCircle className="ml-2 h-5 w-5 animate-spin" />
            </>
          ) : (
            "Modifier le mot de passe"
          )}
        </Button>
      </form>
    </Form>
  );
}
