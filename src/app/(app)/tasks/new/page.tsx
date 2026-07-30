import { redirect } from "next/navigation";
import { createTaskAction } from "@/actions/tasks";
import { getProjectOptions } from "@/actions/options";
import { getManagersAndEmployees } from "@/actions/users";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { TaskForm } from "@/components/features/task-form";

export const metadata = { title: "New Task" };

export default async function NewTaskPage() {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "tasks.create")) {
    redirect("/tasks");
  }

  const [projects, users] = await Promise.all([
    getProjectOptions(),
    getManagersAndEmployees(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Task</h1>
        <p className="text-slate-500">Assign work to an employee</p>
      </div>
      <TaskForm action={createTaskAction} projects={projects} users={users} />
    </div>
  );
}
