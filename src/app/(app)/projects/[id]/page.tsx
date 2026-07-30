import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, updateProjectAction } from "@/actions/projects";
import { getClientOptions } from "@/actions/options";
import { getManagersAndEmployees } from "@/actions/users";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ProjectForm } from "@/components/features/project-form";
import { DocumentUploader } from "@/components/features/document-uploader";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badges";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const [clients, users] = await Promise.all([
    getClientOptions(),
    getManagersAndEmployees(),
  ]);

  const managers = users.filter((u) =>
    ["manager", "admin", "super_admin"].includes(u.role)
  );
  const employees = users.filter(
    (u) => u.role === "employee" || u.role === "manager"
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/projects">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-2 flex gap-2">
          <StatusBadge value={project.status} />
          <PriorityBadge value={project.priority} />
        </div>
      </div>

      {hasPermission(profile.role, "projects.update") ? (
        <ProjectForm
          action={updateProjectAction.bind(null, id)}
          clients={clients}
          managers={managers}
          employees={employees}
          project={project}
        />
      ) : null}

      <DocumentUploader entityType="project" entityId={id} />
    </div>
  );
}
