import Link from "next/link";
import { Plus } from "lucide-react";
import { getProjects, softDeleteProjectAction } from "@/actions/projects";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { PROJECT_STATUSES } from "@/lib/constants";
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
import { DeleteButton } from "@/components/shared/delete-button";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const result = await getProjects({
    page: Number(params.page || 1),
    search: params.search,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-slate-500">{result.count} projects</p>
        </div>
        {hasPermission(profile.role, "projects.create") && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" /> New Project
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All projects</CardTitle>
          <ListFilters statusOptions={PROJECT_STATUSES} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {(project.client as { name?: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={project.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge value={project.priority} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(project.budget)}</TableCell>
                  <TableCell>{formatDate(project.deadline)}</TableCell>
                  <TableCell>
                    {hasPermission(profile.role, "projects.update") && (
                      <DeleteButton
                        action={softDeleteProjectAction.bind(null, project.id)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/projects"
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  );
}
