"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logActivity, createNotification } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import { connectMongo } from "@/lib/mongodb";
import { ClientModel, CompanyModel, newId, toIso } from "@/lib/db/models";
import { UserModel } from "@/lib/auth/user-model";
import { clientSchema } from "@/lib/validations";
import type { ActionResult } from "@/core/types/result";
import type { Client } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";

async function attachClientRelations(client: Record<string, unknown>) {
  const [company, manager, creator] = await Promise.all([
    client.company_id
      ? CompanyModel.findOne({ id: client.company_id, deleted_at: null }).lean()
      : null,
    client.assigned_manager_id
      ? UserModel.findOne({ id: client.assigned_manager_id }).lean()
      : null,
    client.created_by
      ? UserModel.findOne({ id: client.created_by }).lean()
      : null,
  ]);

  return {
    id: String(client.id),
    name: String(client.name),
    company_id: (client.company_id as string | null) ?? null,
    phone: (client.phone as string | null) ?? null,
    email: (client.email as string | null) ?? null,
    website: (client.website as string | null) ?? null,
    address: (client.address as string | null) ?? null,
    industry: (client.industry as string | null) ?? null,
    budget: Number(client.budget ?? 0),
    deadline: (client.deadline as string | null) ?? null,
    requirements: (client.requirements as string | null) ?? null,
    notes: (client.notes as string | null) ?? null,
    status: client.status as Client["status"],
    priority: client.priority as Client["priority"],
    created_by: (client.created_by as string | null) ?? null,
    assigned_manager_id: (client.assigned_manager_id as string | null) ?? null,
    created_at: toIso(client.created_at as Date) ?? new Date().toISOString(),
    updated_at: toIso(client.updated_at as Date) ?? new Date().toISOString(),
    deleted_at: toIso(client.deleted_at as Date | null),
    company: company ? { id: company.id, name: company.name } : null,
    assigned_manager: manager
      ? { id: manager.id, full_name: manager.full_name, email: manager.email }
      : null,
    created_by_profile: creator
      ? { id: creator.id, full_name: creator.full_name }
      : null,
  };
}

export async function getClients(params?: {
  page?: number;
  search?: string;
  status?: string;
  priority?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  await connectMongo();
  const page = params?.page ?? 1;
  const filter: Record<string, unknown> = { deleted_at: null };

  if (params?.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { email: { $regex: params.search, $options: "i" } },
      { industry: { $regex: params.search, $options: "i" } },
    ];
  }
  if (params?.status) filter.status = params.status;
  if (params?.priority) filter.priority = params.priority;

  const sortField = params?.sort || "created_at";
  const sortDir = params?.order === "asc" ? 1 : -1;
  const count = await ClientModel.countDocuments(filter);
  const rows = await ClientModel.find(filter)
    .sort({ [sortField]: sortDir })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const data = await Promise.all(
    rows.map((r) => attachClientRelations(r as Record<string, unknown>))
  );

  return {
    data,
    count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  };
}

export async function getClient(id: string): Promise<Record<string, unknown> & { name: string; status: Client["status"]; priority: Client["priority"]; created_at: string; budget: number | null; email: string | null; phone: string | null; website: string | null; industry: string | null; requirements: string | null; company_id: string | null; assigned_manager_id: string | null; deadline: string | null; address: string | null }> {
  await connectMongo();
  const client = await ClientModel.findOne({ id, deleted_at: null }).lean();
  if (!client) throw new Error("Client not found");
  return attachClientRelations(client as Record<string, unknown>);
}

export async function createClientAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "clients.create")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    company_id: formData.get("company_id") || null,
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    address: formData.get("address") || "",
    industry: formData.get("industry") || "",
    budget: formData.get("budget") || 0,
    deadline: formData.get("deadline") || null,
    requirements: formData.get("requirements") || "",
    status: formData.get("status") || "lead",
    priority: formData.get("priority") || "medium",
    assigned_manager_id: formData.get("assigned_manager_id") || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const id = newId();
  const doc = await ClientModel.create({
    id,
    ...parsed.data,
    company_id: parsed.data.company_id || null,
    assigned_manager_id: parsed.data.assigned_manager_id || null,
    deadline: parsed.data.deadline || null,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    created_by: profile.id,
  });

  await logActivity({
    action: "created",
    entity_type: "client",
    entity_id: id,
    metadata: { name: doc.name },
  });

  if (doc.assigned_manager_id) {
    await createNotification({
      user_id: doc.assigned_manager_id,
      title: "New client assigned",
      message: `You were assigned to client ${doc.name}`,
      link: `/clients/${id}`,
    });
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, data: { id } };
}

export async function updateClientAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "clients.update")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    company_id: formData.get("company_id") || null,
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    address: formData.get("address") || "",
    industry: formData.get("industry") || "",
    budget: formData.get("budget") || 0,
    deadline: formData.get("deadline") || null,
    requirements: formData.get("requirements") || "",
    status: formData.get("status") || "lead",
    priority: formData.get("priority") || "medium",
    assigned_manager_id: formData.get("assigned_manager_id") || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const updated = await ClientModel.findOneAndUpdate(
    { id, deleted_at: null },
    {
      ...parsed.data,
      company_id: parsed.data.company_id || null,
      assigned_manager_id: parsed.data.assigned_manager_id || null,
      deadline: parsed.data.deadline || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
    },
    { new: true }
  ).lean();

  if (!updated) return { success: false, error: "Client not found" };

  await logActivity({
    action: "updated",
    entity_type: "client",
    entity_id: id,
    metadata: { name: updated.name },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { success: true, data: { id } };
}

export async function softDeleteClientAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "clients.delete")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  await ClientModel.updateOne(
    { id },
    { deleted_at: new Date() }
  );

  await logActivity({
    action: "soft_deleted",
    entity_type: "client",
    entity_id: id,
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}
