"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { ROLE_LABELS, Role } from "@/constants/values";
import { formatDate } from "@/lib/utils";
import { useState, useTransition } from "react";
import { deleteUser } from "@/lib/actions/users.action";
import { toast } from "sonner";
import Link from "next/link";
import ROUTES from "@/constants/routes";

type UsersTableProps = {
  users: User[];
  currentUserId?: string;
  currentUserRole?: string;
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  AGENT: "bg-green-100 text-green-700 border-green-200",
  ASSISTANT: "bg-orange-100 text-orange-700 border-orange-200",
  DEVELOPER: "bg-gray-300 text-gray-700 border-gray-400",
  EMPLOYEE: "bg-gray-100 text-gray-700 border-gray-200",
  VIEWER: "bg-slate-100 text-slate-700 border-slate-200",
};
export default function UsersTable({
  users,
  currentUserId,
  currentUserRole,
}: UsersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const result = await deleteUser(userToDelete._id as string);

      if (result.success) {
        toast.success("Utilisateur supprimé avec succès");
      } else {
        toast.error(result.error?.message || "Erreur lors de la suppression");
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
    });
  };

  const canDelete =
    currentUserRole === "ADMIN" || currentUserRole === "DEVELOPER";

  const renderActions = (user: User, isSelf: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link href={ROUTES.USER_DETAIL(user._id as string)} className="flex items-center gap-2"><Pencil className="h-4 w-4" />Modifier</Link></DropdownMenuItem>
        {canDelete && !isSelf && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-3 md:hidden">
            {users.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé</p> : users.map((user) => {
              const userId = user._id as string;
              const isSelf = userId === currentUserId;
              return <article key={userId} className="rounded-xl border bg-card p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11"><AvatarImage src={user.profileImage} /><AvatarFallback className="bg-primary/10 font-medium text-primary">{user.firstname?.[0]}{user.lastname?.[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate font-semibold">{user.firstname} {user.lastname}</p>{isSelf && <Badge variant="outline" className="text-[10px]">Vous</Badge>}</div><p className="text-sm text-muted-foreground">@{user.username}</p></div>
                  {renderActions(user, isSelf)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3"><Badge variant="outline" className={ROLE_COLORS[user.role as Role]}>{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</Badge><span className="text-xs text-muted-foreground">{formatDate((user as unknown as { createdAt: Date }).createdAt)}</span></div>
                <div className="mt-3 space-y-1.5 rounded-lg bg-muted/40 p-2.5 text-sm"><a href={`mailto:${user.email}`} className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{user.email}</span></a>{user.phone && <a href={`tel:${user.phone}`} className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{user.phone}</a>}</div>
              </article>;
            })}
          </div>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const userId = user._id as string;
                  const isSelf = userId === currentUserId;

                  return (
                    <TableRow key={userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {user.firstname?.[0]}
                              {user.lastname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstname} {user.lastname}
                              {isSelf && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  Vous
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ROLE_COLORS[user.role as Role]}
                        >
                          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(
                          (user as unknown as { createdAt: Date }).createdAt
                        )}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={ROUTES.USER_DETAIL(userId)}
                                className="flex items-center gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            {canDelete && !isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(user)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{" "}
              <span className="font-semibold">
                {userToDelete?.firstname} {userToDelete?.lastname}
              </span>
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
