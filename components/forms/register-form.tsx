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

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface AuthFormProps<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  formType: "SIGN_IN" | "SIGN_UP";
  onSubmit: (data: T) => Promise<{ success: boolean }>;
}

const RegisterForm = <T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: AuthFormProps<T>) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = (await onSubmit(data)) as ActionResponse;

    if (result?.success) {
      toast.success("Utilisateur Ajouté", {
        description: "Utilisateur Ajouté avec succès",
        duration: 3000,
      });
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
        className="mt-10 flex flex-col gap-5"
      >
        {Object.keys(defaultValues).map((field) =>
          field === "role" ? (
            <FormField
              key={field}
              control={form.control}
              name={field as Path<T>}
              render={({ field }) => (
                <FormItem className="flex w-full flex-col gap-1">
                  <FormLabel className="paragraph-medium text-dark400_light700">
                    Rôle
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={"Viewer"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="ACCOUNTANT">Comptable</SelectItem>
                        <SelectItem value="VIEWER">Lecteur</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-green-600">
                    Choisissez le rôle de l’utilisateur.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              key={field}
              control={form.control}
              name={field as Path<T>}
              render={({ field }) => (
                <FormItem className="flex w-full flex-col gap-1">
                  <FormLabel className="paragraph-medium text-dark400_light700">
                    {field.name === "email"
                      ? "Adresse Email"
                      : field.name === "firstname"
                      ? "Prenom"
                      : field.name === "lastname"
                      ? "Nom"
                      : field.name === "phone"
                      ? "Numero de téléphone"
                      : field.name === "password"
                      ? "Mot de passe"
                      : field.name === "confirmPassword"
                      ? "Confirmer le mot de passe"
                      : field.name.charAt(0).toUpperCase() +
                        field.name.slice(1)}
                  </FormLabel>
                  <FormControl>
                    <Input
                      required
                      type={
                        field.name === "password" ||
                        field.name === "confirmPassword"
                          ? "password"
                          : field.name === "email"
                          ? "email"
                          : "text"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-green-600">
                    {field.name === "username"
                      ? "This will be your unique username."
                      : null}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        )}
        <Button disabled={form.formState.isSubmitting} className="uppercase">
          {form.formState.isSubmitting ? (
            <>
              Inscription...
              <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
            </>
          ) : (
            "Ajouter"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
