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
import { format } from "date-fns";
import { Card, CardContent } from "./ui/card";
import ClientQualificationSelect from "./ClientQualificationButton";

type ClientsTableProps = {
  clients: Client[];
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

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Qualification</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.map((client) => (
              <TableRow key={client._id}>
                {/* Reference code */}
                <TableCell>
                  <Badge variant="outline">{client.referenceCode}</Badge>
                </TableCell>

                {/* Client name */}
                <TableCell className="font-medium">
                  {client.firstName} {client.lastName}
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Badge variant={TYPE_COLORS[client.type]}>
                    {TYPE_LABELS[client.type]}
                  </Badge>
                </TableCell>

                {/* City */}
                <TableCell>{client.city || "—"}</TableCell>

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
                  {format(new Date(client.createdAt), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <ClientQualificationSelect
                    clientId={client._id}
                    value={client.qualificationStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
