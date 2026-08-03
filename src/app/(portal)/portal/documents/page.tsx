import { getPortalClient, getPortalProjects } from "@/actions/portal";
import { DocumentUploader } from "@/components/features/document-uploader";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function PortalDocumentsPage() {
  const [client, projects] = await Promise.all([
    getPortalClient(),
    getPortalProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Documents</h1>
        <p className="text-muted">
          Upload files for your account or a project — your manager can see them.
        </p>
      </div>

      <DocumentUploader entityType="client" entityId={client.id} />

      {projects.map((project) => (
        <div key={project.id} className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight">{project.name}</h2>
          <DocumentUploader entityType="project" entityId={project.id} />
        </div>
      ))}

      {projects.length === 0 && (
        <p className="text-sm text-muted">
          No projects yet. Project uploads will show here once you have one.
        </p>
      )}
    </div>
  );
}
