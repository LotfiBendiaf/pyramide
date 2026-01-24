import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 8 }: TableSkeletonProps) {
  return (
    <div className="rounded-2xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>

              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>

              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
