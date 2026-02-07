import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ClientTableProps {
  clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des clients</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.map((client) => (
              <TableRow key={client._id}>
                {/* Code */}
                <TableCell className="font-medium">
                  {client.referenceCode}
                </TableCell>

                {/* Name */}
                <TableCell>
                  {client.firstName} {client.lastName}
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Badge variant="outline">{client.type}</Badge>
                </TableCell>

                {/* City */}
                <TableCell>{client.city || "—"}</TableCell>

                {/* Qualification */}
                <TableCell>
                  {client.qualificationStatus === "QUALIFIED" ? (
                    <Badge className="bg-green-600">Qualifié</Badge>
                  ) : (
                    <Badge variant="secondary">En attente</Badge>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label="Modifier le client">
                    <Pencil className="h-4 w-4" />
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
