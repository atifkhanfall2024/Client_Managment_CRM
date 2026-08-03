"use server";

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
import {
  CACHE_TTL,
  CRM_TAGS,
  cachedQuery,
  bustNotifications,
} from "@/lib/cache";
import { canViewFinance, canViewClients } from "@/lib/rbac";

const notDeleted = {
  $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
};

/** Live work: planning, in progress, or on hold (not completed/cancelled). */
const ACTIVE_PROJECT_STATUSES = ["planning", "in_progress", "on_hold"] as const;

export async function getNotifications() {
  const profile = await requireProfile();
  return cachedQuery(
    ["notifications", profile.id],
    [CRM_TAGS.notifications],
    async () => {
      await connectMongo();
      const rows = await NotificationModel.find({ user_id: profile.id })
        .sort({ created_at: -1 })
        .limit(50)
        .lean();

      return rows.map((n) => ({
        id: String(n.id),
        user_id: String(n.user_id),
        title: String(n.title),
        message: String(n.message),
        link: n.link ? String(n.link) : null,
        created_at: toIso(n.created_at) ?? new Date().toISOString(),
        read_at: toIso(n.read_at),
      }));
    },
    CACHE_TTL.unread
  );
}

export async function getUnreadCount(userId?: string) {
  const id = userId ?? (await requireProfile()).id;
  return cachedQuery(
    ["unread-count", id],
    [CRM_TAGS.notifications],
    async () => {
      await connectMongo();
      return NotificationModel.countDocuments({
        user_id: id,
        read_at: null,
      });
    },
    CACHE_TTL.unread
  );
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
  bustNotifications();
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const profile = await requireProfile();
  await connectMongo();
  await NotificationModel.updateMany(
    { user_id: profile.id, read_at: null },
    { read_at: new Date() }
  );
  bustNotifications();
}

export async function getActivityLogs(limit = 50) {
  return cachedQuery(
    ["activity-logs", String(limit)],
    [CRM_TAGS.activity],
    async () => {
      await connectMongo();
      const rows = await ActivityLogModel.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      const actors = await UserModel.find({
        id: { $in: rows.map((r) => r.actor_id).filter(Boolean) },
      })
        .select("id full_name")
        .lean();
      const map = new Map(actors.map((a) => [a.id, a]));

      return rows.map((log) => ({
        id: String(log.id),
        actor_id: log.actor_id ? String(log.actor_id) : null,
        action: String(log.action),
        entity_type: String(log.entity_type),
        entity_id: log.entity_id ? String(log.entity_id) : null,
        created_at: toIso(log.created_at) ?? new Date().toISOString(),
        actor: log.actor_id
          ? {
              id: map.get(log.actor_id)?.id,
              full_name: map.get(log.actor_id)?.full_name,
            }
          : null,
      }));
    },
    CACHE_TTL.activity
  );
}

export async function getDashboardStats() {
  const profile = await requireProfile();
  const stats = await cachedQuery(
    ["dashboard-stats"],
    [CRM_TAGS.dashboard],
    loadDashboardStats,
    CACHE_TTL.dashboard
  );

  if (canViewFinance(profile.role) && canViewClients(profile.role)) {
    return stats;
  }

  return {
    ...stats,
    ...(canViewFinance(profile.role)
      ? {}
      : {
          revenue: 0,
          pipeline_value: 0,
          budget_mix: [] as typeof stats.budget_mix,
          pipeline_clients: [] as typeof stats.pipeline_clients,
        }),
    ...(canViewClients(profile.role)
      ? {}
      : {
          total_clients: 0,
          active_clients: 0,
          lead_clients: 0,
          clients_by_status: [] as typeof stats.clients_by_status,
          pipeline_clients: [] as typeof stats.pipeline_clients,
        }),
    recent_projects: stats.recent_projects.map((p) => ({
      ...p,
      budget: canViewFinance(profile.role) ? p.budget : 0,
      client_name: canViewClients(profile.role) ? p.client_name : "—",
      client_id: canViewClients(profile.role) ? p.client_id : null,
    })),
  };
}

async function loadDashboardStats() {
  await connectMongo();
  const { syncMeetingLifecycle } = await import("@/lib/meetings/lifecycle");
  await syncMeetingLifecycle();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    clientStatusAgg,
    projectBudgetAgg,
    taskStatusAgg,
    recent_activity,
    employeePerfAgg,
    employeeCount,
    recentProjects,
    clientsMonthly,
    projectsMonthly,
    meetingsScheduled,
    allProjectsProgress,
    pipelineClientRows,
  ] = await Promise.all([
    ClientModel.aggregate([
      { $match: notDeleted },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ProjectModel.aggregate([
      { $match: notDeleted },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          budget: { $sum: { $ifNull: ["$budget", 0] } },
        },
      },
    ]),
    TaskModel.aggregate([
      { $match: notDeleted },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    getActivityLogs(8),
    TaskModel.aggregate([
      {
        $match: {
          ...notDeleted,
          assigned_to: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: "$assigned_to",
          total: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
          },
        },
      },
    ]),
    UserModel.countDocuments({
      ...notDeleted,
      is_active: true,
      role: "employee",
      approval_status: "approved",
    }),
    ProjectModel.find(notDeleted)
      .sort({ updated_at: -1 })
      .limit(6)
      .select("id name status progress budget client_id")
      .lean(),
    ClientModel.aggregate([
      {
        $match: {
          ...notDeleted,
          created_at: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: "$created_at" },
            m: { $month: "$created_at" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    ProjectModel.aggregate([
      {
        $match: {
          ...notDeleted,
          created_at: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: "$created_at" },
            m: { $month: "$created_at" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
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
    ClientModel.find({
      ...notDeleted,
      status: { $in: ["lead", "active"] },
    })
      .select("id name status budget")
      .sort({ budget: -1, updated_at: -1 })
      .limit(20)
      .lean(),
  ]);

  const clientCount = (status: string) =>
    Number(clientStatusAgg.find((r) => r._id === status)?.count ?? 0);
  const projectRow = (status: string) =>
    projectBudgetAgg.find((r) => r._id === status);
  const projectCount = (status: string) =>
    Number(projectRow(status)?.count ?? 0);
  const projectBudget = (status: string) =>
    Number(projectRow(status)?.budget ?? 0);
  const taskCount = (status: string) =>
    Number(taskStatusAgg.find((r) => r._id === status)?.count ?? 0);

  const total_clients = clientStatusAgg.reduce(
    (s, r) => s + Number(r.count ?? 0),
    0
  );
  const active_clients = clientCount("active");
  const lead_clients = clientCount("lead");

  const active_projects = ACTIVE_PROJECT_STATUSES.reduce(
    (s, st) => s + projectCount(st),
    0
  );
  const in_progress_projects = projectCount("in_progress");
  const planning_projects = projectCount("planning");
  const completed_projects = projectCount("completed");
  const total_projects = projectBudgetAgg.reduce(
    (s, r) => s + Number(r.count ?? 0),
    0
  );

  const pending_tasks =
    taskCount("todo") + taskCount("in_progress") + taskCount("review");
  const done_tasks = taskCount("done");
  const total_tasks = taskStatusAgg.reduce(
    (s, r) => s + Number(r.count ?? 0),
    0
  );

  const revenue = projectBudget("completed");

  const pipeline_clients = pipelineClientRows.map((c) => ({
    id: String(c.id),
    name: String(c.name),
    status: String(c.status),
    budget: Number(c.budget ?? 0),
  }));

  // Prefer client budgets (what managers add); fall back to active project budgets.
  const clientPipelineTotal = pipeline_clients.reduce(
    (s, c) => s + c.budget,
    0
  );
  const projectPipelineTotal = ACTIVE_PROJECT_STATUSES.reduce(
    (s, st) => s + projectBudget(st),
    0
  );
  const pipeline_value =
    clientPipelineTotal > 0 ? clientPipelineTotal : projectPipelineTotal;

  const assigneeIds = employeePerfAgg
    .map((r) => r._id as string)
    .filter(Boolean);
  const assignees = assigneeIds.length
    ? await UserModel.find({ id: { $in: assigneeIds } })
        .select("id full_name")
        .lean()
    : [];
  const nameMap = new Map(assignees.map((u) => [u.id, u.full_name]));

  const labelize = (s: string) => s.replace(/_/g, " ");

  const clients_by_status = ["lead", "active", "inactive", "archived"].map(
    (status) => ({
      name: labelize(status),
      key: status,
      value: clientCount(status),
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
    value: projectCount(status),
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
    value: taskCount(status),
  }));

  const clientIds = [
    ...new Set(recentProjects.map((p) => p.client_id).filter(Boolean)),
  ];
  const clients = clientIds.length
    ? await ClientModel.find({ id: { $in: clientIds } })
        .select("id name budget")
        .lean()
    : [];
  const clientName = new Map(clients.map((c) => [String(c.id), String(c.name)]));
  const clientBudget = new Map(
    clients.map((c) => [String(c.id), Number(c.budget ?? 0)])
  );

  const monthKeys: { y: number; m: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push({
      y: d.getFullYear(),
      m: d.getMonth() + 1,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }

  const monthCount = (
    rows: { _id: { y: number; m: number }; count: number }[],
    y: number,
    m: number
  ) =>
    Number(
      rows.find((r) => r._id?.y === y && r._id?.m === m)?.count ?? 0
    );

  const monthly_trend = monthKeys.map((m) => ({
    name: m.label,
    clients: monthCount(clientsMonthly, m.y, m.m),
    projects: monthCount(projectsMonthly, m.y, m.m),
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
    pipeline_clients,
    meetings_scheduled: meetingsScheduled,
    completion_rate,
    project_completion_rate,
    recent_activity,
    employee_performance: employeePerfAgg
      .map((r) => ({
        name: nameMap.get(r._id as string) ?? "Unknown",
        total: Number(r.total ?? 0),
        done: Number(r.done ?? 0),
      }))
      .sort(
        (a, b) =>
          b.done / Math.max(b.total, 1) - a.done / Math.max(a.total, 1)
      ),
    clients_by_status,
    projects_by_status,
    tasks_by_status,
    monthly_trend,
    budget_mix,
    progress_leaders,
    recent_projects: recentProjects.map((p) => {
      const cid = p.client_id ? String(p.client_id) : null;
      const projectBudgetValue = Number(p.budget ?? 0);
      const fallbackBudget = cid ? clientBudget.get(cid) ?? 0 : 0;
      return {
        id: String(p.id),
        name: String(p.name),
        status: String(p.status),
        progress: Number(p.progress ?? 0),
        budget: projectBudgetValue > 0 ? projectBudgetValue : fallbackBudget,
        client_id: cid,
        client_name: cid ? clientName.get(cid) ?? "—" : "—",
      };
    }),
  };
}
