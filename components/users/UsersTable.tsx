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

  const canDelete = currentUserRole === "ADMIN";

  return (
    <>
      <Card>
        <CardContent className="p-0">
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
