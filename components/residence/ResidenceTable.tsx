"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Eye, EyeOff, MoreHorizontal, Star, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatPriceAlgeria, formatDate } from "@/lib/utils";
import ROUTES from "@/constants/routes";
import { RESIDENCE_COMPLETION_STATUSES } from "@/constants/values";
import {
  deleteResidence,
  toggleResidencePublished,
} from "@/lib/actions/residence.action";
import { UnitStatusManager } from "./UnitStatusManager";

interface ResidenceTableProps {
  residences: Residence[];
}

function completionBadge(status: ResidenceCompletionStatus) {
  const config = RESIDENCE_COMPLETION_STATUSES.find((s) => s.value === status);
  if (!config) return null;
  return (
    <Badge variant={config.color} className="text-xs">
      {config.label}
    </Badge>
  );
}

function unitCounts(units: ResidenceUnit[] = []) {
  const total = units.length;
  const available = units.filter((u) => u.status === "AVAILABLE").length;
  return { total, available };
}

export function ResidenceTable({ residences }: ResidenceTableProps) {
  const [publishingStates, setPublishingStates] = useState<Record<string, boolean>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    residenceId: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleTogglePublish = async (residenceId: string, currentStatus: boolean) => {
    setPublishingStates((prev) => ({ ...prev, [residenceId]: true }));
    const result = await toggleResidencePublished(residenceId, currentStatus);
    if (result.success) {
      toast.success(
        result.data?.isPublished ? "Résidence publiée" : "Résidence dépubliée"
      );
    } else {
      toast.error(result.error?.message || "Erreur lors de la modification du statut");
    }
    setPublishingStates((prev) => ({ ...prev, [residenceId]: false }));
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    const result = await deleteResidence(deleteDialog.residenceId);
    if (result.success) {
      toast.success("Résidence supprimée");
    } else {
      toast.error(result.error?.message || "Erreur lors de la suppression");
    }
    setDeleting(false);
    setDeleteDialog(null);
  };

  return (
    <Card>
      {/* Mobile */}
      <CardContent className="space-y-3 p-3 md:hidden">
        {residences.map((residence) => {
          const { total, available } = unitCounts(residence.units);
          return (
            <article key={residence._id} className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="flex gap-3">
                <Image
                  src={residence.coverImage || residence.images?.[0]?.url || "/placeholder.png"}
                  alt={residence.title}
                  width={80}
                  height={72}
                  className="h-[72px] w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  {residence.referenceCode && (
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {residence.referenceCode}
                    </Badge>
                  )}
                  <p className="mt-1 truncate text-sm font-semibold">{residence.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {residence.location.city}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Unités</p>
                  <p className="font-semibold">
                    {available}/{total} disponibles
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">À partir de</p>
                  <p className="font-semibold">
                    {residence.priceFrom ? formatPriceAlgeria(residence.priceFrom) : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {completionBadge(residence.completionStatus)}
                {residence.isFeatured && (
                  <Badge variant="orange" className="gap-1 text-xs">
                    <Star className="h-3 w-3" />À la une
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Button asChild className="flex-1" size="sm">
                  <Link href={ROUTES.RESIDENCE_EDIT(residence._id)}>Modifier</Link>
                </Button>
                <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                  <Switch
                    checked={residence.isPublished}
                    onCheckedChange={() =>
                      handleTogglePublish(residence._id, residence.isPublished)
                    }
                    disabled={publishingStates[residence._id]}
                  />
                  <span className="text-xs text-muted-foreground">
                    {residence.isPublished ? "Publiée" : "Privée"}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <UnitStatusManager
                  residenceId={residence._id}
                  residenceTitle={residence.title}
                />
              </div>
            </article>
          );
        })}
      </CardContent>

      {/* Desktop */}
      <CardContent className="hidden overflow-x-auto md:block">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Référence</TableHead>
              <TableHead>Résidence</TableHead>
              <TableHead>Unités</TableHead>
              <TableHead>Prix à partir de</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead>Publication</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residences.map((residence) => {
              const { total, available } = unitCounts(residence.units);
              return (
                <TableRow key={residence._id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {residence.referenceCode && (
                      <Badge variant="outline" className="font-mono">
                        {residence.referenceCode}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={ROUTES.RESIDENCE_EDIT(residence._id)}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <Image
                        src={
                          residence.coverImage ||
                          residence.images?.[0]?.url ||
                          "/placeholder.png"
                        }
                        alt={residence.title}
                        width={64}
                        height={48}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="max-w-[220px] truncate text-sm font-medium">
                          {residence.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {residence.location.city}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="outline">
                        {available}/{total} disponibles
                      </Badge>
                      <div>
                        <UnitStatusManager
                          residenceId={residence._id}
                          residenceTitle={residence.title}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium">
                      {residence.priceFrom ? (
                        formatPriceAlgeria(residence.priceFrom)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {completionBadge(residence.completionStatus)}
                      {residence.deliveryDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(residence.deliveryDate)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={residence.isPublished}
                          onCheckedChange={() =>
                            handleTogglePublish(residence._id, residence.isPublished)
                          }
                          disabled={publishingStates[residence._id]}
                        />
                        <span className="text-sm text-muted-foreground">
                          {residence.isPublished ? (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Publiée
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                              Non publiée
                            </span>
                          )}
                        </span>
                      </div>
                      {residence.isFeatured && (
                        <Badge variant="orange" className="gap-1 text-xs">
                          <Star className="h-3 w-3" />À la une
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={ROUTES.RESIDENCE_EDIT(residence._id)}>
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={ROUTES.RESIDENCE_DETAIL(residence.slug)}
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Voir sur le site
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              residenceId: residence._id,
                              title: residence.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog
        open={deleteDialog?.open || false}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la résidence</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer « {deleteDialog?.title} » ? Cette action
              est irréversible et supprimera également toutes les unités associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
