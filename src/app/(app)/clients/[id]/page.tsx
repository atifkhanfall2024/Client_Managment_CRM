import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, updateClientAction } from "@/actions/clients";
import { getAllCompanies } from "@/actions/companies";
import { getManagersAndEmployees } from "@/actions/users";
import { getPortalUserStatus } from "@/actions/portal";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientForm } from "@/components/features/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badges";
import { DocumentUploader } from "@/components/features/document-uploader";
import { ClientPortalAccessForm } from "@/components/features/client-portal-access-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const client = await getClient(id);
    return { title: client.name };
  } catch {
    return { title: "Client" };
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  let client;
  try {
    client = await getClient(id);
  } catch {
    notFound();
  }

  const [companies, users, portalStatus] = await Promise.all([
    getAllCompanies(),
    getManagersAndEmployees(),
    getPortalUserStatus(id),
  ]);
  const managers = users.filter((u) =>
    ["manager", "admin", "super_admin"].includes(u.role)
  );

  const canEdit = hasPermission(profile.role, "clients.update");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/clients">← Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={client.status} />
            <PriorityBadge value={client.priority} />
          </div>
        </div>
        <div className="text-sm text-slate-500">
          <p>Created {formatDate(client.created_at)}</p>
          <p>Budget {formatCurrency(client.budget)}</p>
        </div>
      </div>

      {canEdit ? (
        <ClientForm
          action={updateClientAction.bind(null, id)}
          companies={companies}
          managers={managers}
          client={client}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Client details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <p>
              <span className="text-slate-500">Email:</span> {client.email ?? "—"}
            </p>
            <p>
              <span className="text-slate-500">Phone:</span> {client.phone ?? "—"}
            </p>
            <p>
              <span className="text-slate-500">Industry:</span>{" "}
              {client.industry ?? "—"}
            </p>
            <p>
              <span className="text-slate-500">Website:</span>{" "}
              {client.website ?? "—"}
            </p>
            <p className="sm:col-span-2">
              <span className="text-slate-500">Requirements:</span>{" "}
              {client.requirements ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <ClientPortalAccessForm
          clientId={id}
          defaultEmail={client.email as string | null}
          defaultName={client.name as string}
          hasPortal={portalStatus.linked || Boolean(client.portal_user_id)}
          portalApprovalStatus={portalStatus.approval_status}
          portalEmail={portalStatus.email}
        />
      )}

      <DocumentUploader entityType="client" entityId={id} />
    </div>
  );
}
