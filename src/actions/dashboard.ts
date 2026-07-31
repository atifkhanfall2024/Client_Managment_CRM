"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import {
  ActivityLogModel,
  ClientModel,
  NotificationModel,
  ProjectMeetingModel,
  ProjectModel,
  TaskModel,
  toIso,
} from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import type { ActionResult } from "@/core/types/result";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

/** Live work: planning, in progress, or on hold (not completed/cancelled). */
const ACTIVE_PROJECT_STATUSES = ["planning", "in_progress", "on_hold"] as const;

export async function getNotifications() {
  const profile = await requireProfile();
  await connectMongo();
  const rows = await NotificationModel.find({ user_id: profile.id })
    .sort({ created_at: -1 })
    .limit(50)
    .lean();

  return rows.map((n) => ({
    ...n,
    created_at: toIso(n.created_at) ?? new Date().toISOString(),
    read_at: toIso(n.read_at),
  }));
}

export async function getUnreadCount() {
  const profile = await requireProfile();
  await connectMongo();
  return NotificationModel.countDocuments({
    user_id: profile.id,
    read_at: null,
  });
}

export async function markNotificationReadAction(
  id: string
): Promise<ActionResult> {
  const profile = await requireProfile();
  await connectMongo();
  await NotificationModel.updateOne(
    { id, user_id: profile.id },
    { read_at: new Date() }
  );
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const profile = await requireProfile();
  await connectMongo();
  await NotificationModel.updateMany(
    { user_id: profile.id, read_at: null },
    { read_at: new Date() }
  );
  revalidatePath("/notifications");
}

export async function getActivityLogs(limit = 50) {
  await connectMongo();
  const rows = await ActivityLogModel.find()
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();

  const actors = await UserModel.find({
    id: { $in: rows.map((r) => r.actor_id).filter(Boolean) },
  }).lean();
  const map = new Map(actors.map((a) => [a.id, a]));

  return rows.map((log) => ({
    ...log,
    created_at: toIso(log.created_at) ?? new Date().toISOString(),
    actor: log.actor_id
      ? {
          id: map.get(log.actor_id)?.id,
          full_name: map.get(log.actor_id)?.full_name,
        }
      : null,
  }));
}

export async function getDashboardStats() {
  await connectMongo();

  const [
    total_clients,
    active_clients,
    lead_clients,
    active_projects,
    in_progress_projects,
    planning_projects,
    completed_projects,
    total_projects,
    pending_tasks,
    done_tasks,
    total_tasks,
    allProjectBudgets,
    recent_activity,
    employeeTasks,
    employeeCount,
    clientStatusAgg,
    projectStatusAgg,
    taskStatusAgg,
    recentProjects,
  ] = await Promise.all([
    ClientModel.countDocuments(notDeleted),
    ClientModel.countDocuments({ ...notDeleted, status: "active" }),
    ClientModel.countDocuments({ ...notDeleted, status: "lead" }),
    ProjectModel.countDocuments({
      ...notDeleted,
      status: { $in: [...ACTIVE_PROJECT_STATUSES] },
    }),
    ProjectModel.countDocuments({ ...notDeleted, status: "in_progress" }),
    ProjectModel.countDocuments({ ...notDeleted, status: "planning" }),
    ProjectModel.countDocuments({ ...notDeleted, status: "completed" }),
    ProjectModel.countDocuments(notDeleted),
    TaskModel.countDocuments({
      ...notDeleted,
      status: { $in: ["todo", "in_progress", "review"] },
    }),
    TaskModel.countDocuments({ ...notDeleted, status: "done" }),
    TaskModel.countDocuments(notDeleted),
    ProjectModel.find(notDeleted).select("budget status").lean(),
    getActivityLogs(8),
    TaskModel.find({ ...notDeleted, assigned_to: { $ne: null } })
      .select("assigned_to status")
      .lean(),
    UserModel.countDocuments({
      ...notDeleted,
      is_active: true,
      role: "employee",
      approval_status: "approved",
    }),
    ClientModel.aggregate([
      { $match: notDeleted },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ProjectModel.aggregate([
      { $match: notDeleted },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    TaskModel.aggregate([
      { $match: notDeleted },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ProjectModel.find(notDeleted)
      .sort({ updated_at: -1 })
      .limit(6)
      .select("id name status progress budget client_id")
      .lean(),
  ]);

  const revenue = allProjectBudgets
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.budget ?? 0), 0);

  const pipeline_value = allProjectBudgets
    .filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status as (typeof ACTIVE_PROJECT_STATUSES)[number]))
    .reduce((sum, p) => sum + Number(p.budget ?? 0), 0);

  const assignees = await UserModel.find({
    id: { $in: [...new Set(employeeTasks.map((t) => t.assigned_to))] },
  }).lean();
  const nameMap = new Map(assignees.map((u) => [u.id, u.full_name]));

  const perfMap = new Map<string, { name: string; total: number; done: number }>();
  for (const t of employeeTasks) {
    const id = t.assigned_to as string;
    const current = perfMap.get(id) ?? {
      name: nameMap.get(id) ?? "Unknown",
      total: 0,
      done: 0,
    };
    current.total += 1;
    if (t.status === "done") current.done += 1;
    perfMap.set(id, current);
  }

  const labelize = (s: string) => s.replace(/_/g, " ");

  const clients_by_status = ["lead", "active", "inactive", "archived"].map(
    (status) => ({
      name: labelize(status),
      key: status,
      value: Number(
        clientStatusAgg.find((r) => r._id === status)?.count ?? 0
      ),
    })
  );

  const projects_by_status = [
    "planning",
    "in_progress",
    "on_hold",
    "completed",
    "cancelled",
  ].map((status) => ({
    name: labelize(status),
    key: status,
    value: Number(
      projectStatusAgg.find((r) => r._id === status)?.count ?? 0
    ),
  }));

  const tasks_by_status = [
    "todo",
    "in_progress",
    "review",
    "done",
    "cancelled",
  ].map((status) => ({
    name: labelize(status),
    key: status,
    value: Number(taskStatusAgg.find((r) => r._id === status)?.count ?? 0),
  }));

  const clientIds = [
    ...new Set(recentProjects.map((p) => p.client_id).filter(Boolean)),
  ];
  const clients = await ClientModel.find({ id: { $in: clientIds } })
    .select("id name")
    .lean();
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  // Last 6 months trend (clients + projects created)
  const now = new Date();
  const monthKeys: { key: string; label: string; start: Date; end: Date }[] =
    [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthKeys.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      start: d,
      end,
    });
  }

  const [clientsCreated, projectsCreated, meetingsScheduled, allProjectsProgress] =
    await Promise.all([
      ClientModel.find(notDeleted).select("created_at").lean(),
      ProjectModel.find(notDeleted).select("created_at budget status progress").lean(),
      ProjectMeetingModel.countDocuments({
        ...notDeleted,
        status: "scheduled",
      }),
      ProjectModel.find({
        ...notDeleted,
        status: { $in: [...ACTIVE_PROJECT_STATUSES] },
      })
        .select("id name progress")
        .sort({ progress: -1 })
        .limit(8)
        .lean(),
    ]);

  const monthly_trend = monthKeys.map((m) => ({
    name: m.label,
    clients: clientsCreated.filter((c) => {
      const t = new Date(c.created_at as Date).getTime();
      return t >= m.start.getTime() && t < m.end.getTime();
    }).length,
    projects: projectsCreated.filter((p) => {
      const t = new Date(p.created_at as Date).getTime();
      return t >= m.start.getTime() && t < m.end.getTime();
    }).length,
  }));

  const budget_mix = [
    { name: "Pipeline", value: pipeline_value, key: "pipeline" },
    { name: "Completed revenue", value: revenue, key: "revenue" },
  ];

  const progress_leaders = allProjectsProgress.map((p) => ({
    name:
      String(p.name).length > 16
        ? `${String(p.name).slice(0, 14)}…`
        : String(p.name),
    value: Number(p.progress ?? 0),
    key: String(p.id ?? p.name),
  }));

  const completion_rate =
    total_tasks === 0 ? 0 : Math.round((done_tasks / total_tasks) * 100);
  const project_completion_rate =
    total_projects === 0
      ? 0
      : Math.round((completed_projects / total_projects) * 100);

  return {
    total_clients,
    active_clients,
    lead_clients,
    active_projects,
    in_progress_projects,
    planning_projects,
    completed_projects,
    total_projects,
    pending_tasks,
    done_tasks,
    total_tasks,
    employees: employeeCount,
    revenue,
    pipeline_value,
    meetings_scheduled: meetingsScheduled,
    completion_rate,
    project_completion_rate,
    recent_activity,
    employee_performance: Array.from(perfMap.values()).sort(
      (a, b) => b.done / Math.max(b.total, 1) - a.done / Math.max(a.total, 1)
    ),
    clients_by_status,
    projects_by_status,
    tasks_by_status,
    monthly_trend,
    budget_mix,
    progress_leaders,
    recent_projects: recentProjects.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      status: String(p.status),
      progress: Number(p.progress ?? 0),
      budget: Number(p.budget ?? 0),
      client_name: clientName.get(p.client_id as string) ?? "—",
    })),
  };
}
