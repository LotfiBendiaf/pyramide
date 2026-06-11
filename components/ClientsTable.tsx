"use client";

import Link from "next/link";
import { ListPlus } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

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
  const canAssignAgent =
    userRole === "ADMIN" || userRole === "MANAGER" || userRole === "DEVELOPER";

  const canQualifyClient =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "DEVELOPER" ||
    userRole === "AGENT";

  return (
    <Card>
      <CardContent className="overflow-x-auto">
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
            {clients.map((client) => (
              <TableRow
                key={client._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  window.open(ROUTES.CLIENT_DETAIL(client._id), "_blank")
                }
                onAuxClick={(e) =>
                  e.button === 1 &&
                  window.open(ROUTES.CLIENT_DETAIL(client._id), "_blank")
                }
              >
                {/* Reference code */}
                <TableCell>
                  <Badge variant="outline">{client.referenceCode}</Badge>
                </TableCell>

                {/* Client name */}
                {/* <TableCell className="font-medium">
                  {client.firstName} {client.lastName}
                </TableCell> */}

                {/* Type */}
                <TableCell>
                  <Badge variant={TYPE_COLORS[client.type]}>
                    {TYPE_LABELS[client.type]}
                  </Badge>
                </TableCell>

                {/* City */}
                {/* <TableCell>{client.city || "—"}</TableCell> */}

                {/* Contact */}
                <TableCell>
                  <div className="text-sm">
                    <p>{client.phone}</p>
                    {client.email && (
                      <p className="text-muted-foreground">{client.email}</p>
                    )}
                  </div>
                </TableCell>

                {/* Created at */}
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(client.createdAt)}
                </TableCell>

                {/* Agent */}
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

                {/* Pipeline status */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canQualifyClient ? (
                    <ClientQualificationAndNegotiationSelect
                      clientId={client._id}
                      qualificationStatus={client.qualificationStatus}
                      pipelineStage={client.pipelineStage}
                      listings={negotiationListings}
                    />
                  ) : (
                    <Badge
                      variant={
                        PIPELINE_STATUS_VARIANTS[
                          getPipelineStatusKey(client)
                        ] || "outline"
                      }
                    >
                      {PIPELINE_STATUS_LABELS[getPipelineStatusKey(client)] ||
                        "Neutre"}
                    </Badge>
                  )}
                </TableCell>

                {/* Compte rendu */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ClientNotesDialog
                    clientId={client._id}
                    clientName={
                      [client.firstName, client.lastName]
                        .filter(Boolean)
                        .join(" ") || client.referenceCode
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

                {/* Suivi */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 whitespace-nowrap"
                    title="Ajouter un suivi"
                  >
                    <Link
                      href={`${ROUTES.NEW_FOLLOWUP}?clientId=${client._id}`}
                    >
                      <ListPlus className="h-4 w-4" />
                      Ajouter suivi
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
