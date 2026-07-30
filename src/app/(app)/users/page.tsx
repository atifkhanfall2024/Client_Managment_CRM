import { redirect } from "next/navigation";
import {
  getUsers,
  softDeleteUserAction,
  updateUserFromFormAction,
} from "@/actions/users";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { ListFilters } from "@/components/shared/list-filters";
import { DeleteButton } from "@/components/shared/delete-button";
import { UserEditForm } from "@/components/features/user-edit-form";

export const metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "users.manage")) {
    redirect("/dashboard");
  }

  const result = await getUsers({
    page: Number(params.page || 1),
    search: params.search,
    role: params.role || params.status,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-slate-500">Manage roles and access</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team members</CardTitle>
          <ListFilters statusOptions={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.approval_status === "approved"
                          ? "success"
                          : user.approval_status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                      className="capitalize"
                    >
                      {user.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    {user.id !== profile.id && (
                      <DeleteButton
                        action={softDeleteUserAction.bind(null, user.id)}
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
            basePath="/users"
            searchParams={params}
          />

          <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="mb-4 font-semibold">Edit user role</h2>
            <UserEditForm
              users={result.data}
              action={updateUserFromFormAction}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
