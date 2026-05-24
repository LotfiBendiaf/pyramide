// SignInForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { z, ZodType } from "zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Separator } from "../ui/separator";
interface AuthFormProps<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  formType: "SIGN_IN" | "SIGN_UP";
  onSubmit: (data: T) => Promise<{ success: boolean }>;
}

const SignInForm = <T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: AuthFormProps<T>) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });
  // 2. Define a submit handler.

  const { update } = useSession();

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = (await onSubmit(data)) as ActionResponse;

    if (result?.success) {
      await update(); // make sure session is up to date before navigating
      toast.success("Connexion", {
        description: "Connexion réussie",
        duration: 3000,
      });
      router.push(ROUTES.DASHBOARD);
    } else {
      toast.error(`Error ${result?.status}`, {
        description: result?.error?.message,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5"
      >
        {Object.keys(defaultValues).map((field) => (
          <FormField
            key={field}
            control={form.control}
            name={field as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {field.name === "password"
                    ? "Mot de Passe"
                    : field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                </FormLabel>
                <FormControl>
                  <Input
                    required
                    type={
                      field.name === "password"
                        ? "password"
                        : field.name === "email"
                          ? "email"
                          : "text"
                    }
                    {...field}
                    className=""
                    placeholder={
                      field.name === "email" ? "mail@exemple.com" : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end -mt-2">
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              Connexion...
              <LoaderCircle className="animate-spin w-5 h-5 ml-2" />
            </>
          ) : (
            "Connexion"
          )}
        </Button>
      </form>
      <Separator />
      <p className="text-center text-sm text-muted-foreground">
        En Cas de problème, contactez l&apos;administrateur.
      </p>
    </Form>
  );
};

export default SignInForm;
