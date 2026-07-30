import Link from "next/link";
import { Plus } from "lucide-react";
import { getTasks, softDeleteTaskAction } from "@/actions/tasks";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { TASK_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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

export const metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const result = await getTasks({
    page: Number(params.page || 1),
    search: params.search,
    status: params.status,
    mine: params.mine === "1",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-500">
            {profile.role === "employee"
              ? "Your assigned tasks"
              : `${result.count} tasks`}
          </p>
        </div>
        <div className="flex gap-2">
          {profile.role !== "employee" && (
            <Button asChild variant="outline">
              <Link href="/tasks?mine=1">My tasks</Link>
            </Button>
          )}
          {hasPermission(profile.role, "tasks.create") && (
            <Button asChild>
              <Link href="/tasks/new">
                <Plus className="h-4 w-4" /> New Task
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task list</CardTitle>
          <ListFilters statusOptions={TASK_STATUSES} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {(task.project as { name?: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {(task.assignee as { full_name?: string } | null)
                      ?.full_name ?? "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={task.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge value={task.priority} />
                  </TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    {hasPermission(profile.role, "tasks.create") && (
                      <DeleteButton
                        action={softDeleteTaskAction.bind(null, task.id)}
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
            basePath="/tasks"
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  );
}
