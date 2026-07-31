import Link from "next/link";
import { getPortalProjects } from "@/actions/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "My Projects" };
export const dynamic = "force-dynamic";

export default async function PortalProjectsPage() {
  const projects = await getPortalProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My projects</h1>
        <p className="text-muted">
          Live status of every project linked to your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 && (
          <Card className="border-border md:col-span-2">
            <CardContent className="py-12 text-center text-sm text-muted">
              No projects yet.
            </CardContent>
          </Card>
        )}
        {projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`}>
            <Card className="h-full border-border transition hover:border-brand/40 hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {project.status.replace(/_/g, " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="line-clamp-2 text-sm text-muted">
                    {project.description}
                  </p>
                )}
                <div className="h-2 overflow-hidden rounded-full bg-brand-soft/60">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, project.progress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{project.progress}% complete</span>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
                <p className="text-xs text-muted">
                  Updated {formatDate(project.updated_at)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
