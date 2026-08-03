import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getClients, softDeleteClientAction } from "@/actions/clients";
import { requireProfile } from "@/lib/auth";
import { hasPermission, canViewFinance } from "@/lib/rbac";
import { CLIENT_STATUSES, PRIORITIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badges";
import { Pagination } from "@/components/shared/pagination";
import { ListFilters } from "@/components/shared/list-filters";
import { ExportClientsButton } from "@/components/features/export-clients-button";
import { DeleteButton } from "@/components/shared/delete-button";

export const metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "clients.view")) {
    redirect("/dashboard");
  }
  const showFinance = canViewFinance(profile.role);
  const result = await getClients({
    page: Number(params.page || 1),
    search: params.search,
    status: params.status,
    priority: params.priority,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-slate-500">{result.count} total clients</p>
        </div>
        <div className="flex gap-2">
          {showFinance && <ExportClientsButton clients={result.data} />}
          {hasPermission(profile.role, "clients.create") && (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" /> New Client
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All clients</CardTitle>
          <ListFilters
            statusOptions={CLIENT_STATUSES}
            priorityOptions={PRIORITIES}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                {showFinance && <TableHead>Budget</TableHead>}
                <TableHead>Manager</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={showFinance ? 8 : 7}
                    className="py-10 text-center text-slate-500"
                  >
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
              {result.data.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {client.name}
                    </Link>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </TableCell>
                  <TableCell>
                    {(client.company as { name?: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={client.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge value={client.priority} />
                  </TableCell>
                  {showFinance && (
                    <TableCell>{formatCurrency(client.budget)}</TableCell>
                  )}
                  <TableCell>
                    {(client.assigned_manager as { full_name?: string } | null)
                      ?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(client.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/clients/${client.id}`}>View</Link>
                      </Button>
                      {hasPermission(profile.role, "clients.delete") && (
                        <DeleteButton
                          action={softDeleteClientAction.bind(null, client.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/clients"
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  );
}
