"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, ListPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent } from "./ui/card";
import ClientAgentSelect from "./ClientAgentSelect";
import ClientQualificationAndNegotiationSelect from "./ClientQualificationAndNegotiationSelect";
import ClientNotesDialog from "./clients/ClientNotesDialog";
import ROUTES from "@/constants/routes";
import type { NegotiationListingOption } from "@/lib/actions/negotiation.action";
import { cancelClientArchiveRequest } from "@/lib/actions/archiveRequest.action";
import { formatDate } from "@/lib/utils";
import PhoneActionLink from "@/components/PhoneActionLink";

type ClientsTableProps = {
  clients: Client[];
  agents?: User[];
  userRole?: string;
  negotiationListings?: NegotiationListingOption[];
};

const TYPE_LABELS: Record<string, string> = {
  BUYER: "Acheteur",
  SELLER: "Vendeur",
  RENTER: "Loueur",
  INVESTOR: "Investisseur",
};

const TYPE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  BUYER: "default",
  SELLER: "secondary",
  RENTER: "outline",
  INVESTOR: "secondary",
};

const PIPELINE_STATUS_LABELS: Record<string, string> = {
  NEUTRAL: "Neutre",
  NEW: "Nouveau",
  QUALIFIED: "Nouveau",
  HOT: "Chaud",
  COLD: "Froid",
  NO_RESPONSE: "N'a pas répondu",
  NOT_RELEVANT: "Non pertinent",
  ARCHIVED: "Archivé",
  IN_NEGOTIATION: "En négociation",
  CLOSED: "Closing",
};

const PIPELINE_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  NEUTRAL: "outline",
  NEW: "default",
  QUALIFIED: "default",
  HOT: "secondary",
  COLD: "outline",
  NO_RESPONSE: "secondary",
  NOT_RELEVANT: "secondary",
  ARCHIVED: "outline",
  IN_NEGOTIATION: "secondary",
  CLOSED: "default",
};

function getPipelineStatusKey(client: Client) {
  if (client.pipelineStage === "IN_NEGOTIATION") {
    return "IN_NEGOTIATION";
  }
  if (client.pipelineStage === "CLOSED") {
    return "CLOSED";
  }
  return client.qualificationStatus ?? "NEUTRAL";
}

export default function ClientsTable({
  clients,
  agents = [],
  userRole,
  negotiationListings = [],
}: ClientsTableProps) {
  const router = useRouter();
  const [cancelingClientId, setCancelingClientId] = useState<string | null>(
    null
  );
  const canAssignAgent =
    userRole === "ADMIN" || userRole === "MANAGER" || userRole === "DEVELOPER";

  const canQualifyClient =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "DEVELOPER" ||
    userRole === "AGENT";

  const activeClients = clients.filter(
    (client) => !client.hasPendingArchiveRequest
  );
  const pendingArchiveClients = clients.filter(
    (client) => client.hasPendingArchiveRequest
  );
  const columnCount = canAssignAgent ? 8 : 7;

  const handleCancelArchiveRequest = async (clientId: string) => {
    setCancelingClientId(clientId);
    const result = await cancelClientArchiveRequest(clientId);
    setCancelingClientId(null);

    if (!result.success) {
      toast.error("Impossible d'annuler la demande", {
        description: result.error?.message,
      });
      return;
    }

    toast.success("Demande d'archivage annulée");
    router.refresh();
  };

  const renderClientRow = (client: Client) => (
    <TableRow
      key={client._id}
      className={
        client.hasPendingArchiveRequest
          ? "cursor-pointer bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
          : "cursor-pointer hover:bg-muted/50"
      }
      onClick={() =>
        window.open(ROUTES.CLIENT_DETAIL(client._id), "_blank")
      }
      onAuxClick={(e) =>
        e.button === 1 &&
        window.open(ROUTES.CLIENT_DETAIL(client._id), "_blank")
      }
    >
      <TableCell>
        <Badge variant="outline">{client.referenceCode}</Badge>
      </TableCell>

      <TableCell>
        <Badge variant={TYPE_COLORS[client.type]}>
          {TYPE_LABELS[client.type]}
        </Badge>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="text-sm">
          <PhoneActionLink phone={client.phone} />
          {client.email && (
            <p className="text-muted-foreground">{client.email}</p>
          )}
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {formatDate(client.createdAt)}
      </TableCell>

      {canAssignAgent && (
        <TableCell
          className="w-[190px] text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <ClientAgentSelect
            clientId={client._id}
            agents={agents}
            value={client.assignedAgent?._id}
          />
        </TableCell>
      )}

      <TableCell onClick={(e) => e.stopPropagation()}>
        {client.hasPendingArchiveRequest ? (
          <div className="flex items-center gap-2">
            <Badge className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Clock3 className="mr-1 size-3" />
              Archivage en attente
            </Badge>
            {client.canCancelPendingArchiveRequest && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:text-amber-200"
                disabled={cancelingClientId === client._id}
                onClick={() => handleCancelArchiveRequest(client._id)}
              >
                {cancelingClientId === client._id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                Annuler
              </Button>
            )}
          </div>
        ) : canQualifyClient ? (
          <ClientQualificationAndNegotiationSelect
            clientId={client._id}
            qualificationStatus={client.qualificationStatus}
            pipelineStage={client.pipelineStage}
            listings={negotiationListings}
            canUseRestrictedStatuses={userRole === "ADMIN" || userRole === "DEVELOPER"}
          />
        ) : (
          <Badge
            variant={
              PIPELINE_STATUS_VARIANTS[getPipelineStatusKey(client)] ||
              "outline"
            }
          >
            {PIPELINE_STATUS_LABELS[getPipelineStatusKey(client)] || "Neutre"}
          </Badge>
        )}
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <ClientNotesDialog
          clientId={client._id}
          clientName={
            [client.firstName, client.lastName].filter(Boolean).join(" ") ||
            client.referenceCode
          }
          initialNotes={client.extraNotes}
          preferredLocation={client.preferredLocation}
          budgetMin={client.budgetMin}
          budgetMax={client.budgetMax}
          priceCurrency={client.priceCurrency}
          wantedPropertyType={client.wantedPropertyType}
          rooms={client.rooms}
        />
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 whitespace-nowrap"
          title="Ajouter un suivi"
        >
          <Link href={`${ROUTES.NEW_FOLLOWUP}?clientId=${client._id}`}>
            <ListPlus className="h-4 w-4" />
            Ajouter suivi
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderClientCard = (client: Client) => (
    <article key={client._id} className={`rounded-xl border p-3 shadow-sm ${client.hasPendingArchiveRequest ? "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20" : "bg-card"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline">{client.referenceCode}</Badge><Badge variant={TYPE_COLORS[client.type]}>{TYPE_LABELS[client.type]}</Badge></div>
          <p className="mt-2 truncate font-semibold">{[client.firstName, client.lastName].filter(Boolean).join(" ") || "Client"}</p>
          <div className="mt-1 text-sm"><PhoneActionLink phone={client.phone} />{client.email && <p className="truncate text-xs text-muted-foreground">{client.email}</p>}</div>
        </div>
        <ClientNotesDialog clientId={client._id} clientName={[client.firstName, client.lastName].filter(Boolean).join(" ") || client.referenceCode} initialNotes={client.extraNotes} preferredLocation={client.preferredLocation} budgetMin={client.budgetMin} budgetMax={client.budgetMax} priceCurrency={client.priceCurrency} wantedPropertyType={client.wantedPropertyType} rooms={client.rooms} />
      </div>
      <div className="mt-3 space-y-2 border-t pt-3">
        {client.hasPendingArchiveRequest ? <div className="flex flex-wrap items-center gap-2"><Badge className="border-amber-300 bg-amber-100 text-amber-800"><Clock3 className="mr-1 size-3" />Archivage en attente</Badge>{client.canCancelPendingArchiveRequest && <Button size="sm" variant="outline" disabled={cancelingClientId === client._id} onClick={() => handleCancelArchiveRequest(client._id)}>{cancelingClientId === client._id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Annuler</Button>}</div> : canQualifyClient ? <ClientQualificationAndNegotiationSelect clientId={client._id} qualificationStatus={client.qualificationStatus} pipelineStage={client.pipelineStage} listings={negotiationListings} canUseRestrictedStatuses={userRole === "ADMIN" || userRole === "DEVELOPER"} /> : <Badge variant={PIPELINE_STATUS_VARIANTS[getPipelineStatusKey(client)] || "outline"}>{PIPELINE_STATUS_LABELS[getPipelineStatusKey(client)] || "Neutre"}</Badge>}
        {canAssignAgent && <ClientAgentSelect clientId={client._id} agents={agents} value={client.assignedAgent?._id} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" asChild><Link href={`${ROUTES.NEW_FOLLOWUP}?clientId=${client._id}`}><ListPlus className="h-4 w-4" />Suivi</Link></Button>
        <Button size="sm" onClick={() => window.open(ROUTES.CLIENT_DETAIL(client._id), "_blank")}>Ouvrir</Button>
      </div>
    </article>
  );

  return (
    <Card>
      <CardContent className="space-y-3 p-3 md:hidden">
        {activeClients.map(renderClientCard)}
        {pendingArchiveClients.length > 0 && <div className="flex items-center gap-2 px-1 pt-2 text-sm font-semibold text-amber-800"><Clock3 className="size-4" />Archivages en attente <Badge variant="outline">{pendingArchiveClients.length}</Badge></div>}
        {pendingArchiveClients.map(renderClientCard)}
      </CardContent>
      <CardContent className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              {/* <TableHead>Client</TableHead> */}
              <TableHead>Type</TableHead>
              {/* <TableHead>Ville</TableHead> */}
              <TableHead>Contact</TableHead>
              <TableHead>Créé le</TableHead>
              {canAssignAgent && (
                <TableHead className="w-[190px] text-center">Agent</TableHead>
              )}
              <TableHead>Pipeline status</TableHead>
              <TableHead>C.R.</TableHead>
              <TableHead>Suivi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {activeClients.map(renderClientRow)}
            {pendingArchiveClients.length > 0 && (
              <TableRow className="border-y border-amber-200 bg-amber-50 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <TableCell colSpan={columnCount} className="py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                    <Clock3 className="size-4" aria-hidden="true" />
                    Demandes d&apos;archivage en attente
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-200"
                    >
                      {pendingArchiveClients.length}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {pendingArchiveClients.map(renderClientRow)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
