import { Plus } from "lucide-react";
import {
  createCompanyAction,
  getCompanies,
  softDeleteCompanyAction,
} from "@/actions/companies";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
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
import { Pagination } from "@/components/shared/pagination";
import { ListFilters } from "@/components/shared/list-filters";
import { DeleteButton } from "@/components/shared/delete-button";
import { CompanyCreateForm } from "@/components/features/company-create-form";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "companies.manage")) {
    return <p>Permission denied</p>;
  }

  const result = await getCompanies({
    page: Number(params.page || 1),
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-slate-500">Organizations linked to your clients</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" /> Add company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyCreateForm action={createCompanyAction} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">All companies</CardTitle>
            <ListFilters />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry ?? "—"}</TableCell>
                    <TableCell>{company.email ?? "—"}</TableCell>
                    <TableCell>{formatDate(company.created_at)}</TableCell>
                    <TableCell>
                      <DeleteButton
                        action={softDeleteCompanyAction.bind(null, company.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath="/companies"
              searchParams={params}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
