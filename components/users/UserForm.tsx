"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, UserPlus, Save } from "lucide-react";

import {
  CreateUserSchema,
  UpdateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/validators/user";
import { createUser, updateUser } from "@/lib/actions/users.action";
import { ROLE_LABELS, Role } from "@/constants/values";
import ROUTES from "@/constants/routes";

interface UserFormProps {
  user?: User;
  mode?: "create" | "edit";
}

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"];

export default function UserForm({ user, mode = "create" }: UserFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = mode === "edit" && user;

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? UpdateUserSchema : CreateUserSchema),
    defaultValues: {
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: (user?.role as Role) || "AGENT",
      ...(isEditing ? {} : { password: "", confirmPassword: "" }),
    },
  });

  const onSubmit = (data: CreateUserInput | UpdateUserInput) => {
    startTransition(async () => {
      try {
        let result;

        if (isEditing) {
          result = await updateUser(
            user._id as string,
            data as UpdateUserInput
          );
        } else {
          result = await createUser(data as CreateUserInput);
        }

        if (result.success) {
          toast.success(
            isEditing ? "Utilisateur modifié" : "Utilisateur créé",
            {
              description: isEditing
                ? "Les informations ont été mises à jour"
                : "L'utilisateur a été ajouté avec succès",
            }
          );
          router.push(ROUTES.USERS);
        } else {
          toast.error("Erreur", {
            description: result.error?.message || "Une erreur est survenue",
          });
        }
      } catch {
        toast.error("Erreur", {
          description: "Une erreur inattendue est survenue",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <Save className="h-5 w-5" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          {isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifiez les informations de l'utilisateur"
            : "Remplissez les informations pour créer un nouvel utilisateur"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prenom..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="...@pyramideimmobiler.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+213 555 123 456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          value={field.value || ""}
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
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Modification..." : "Création..."}
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer l&apos;utilisateur
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
