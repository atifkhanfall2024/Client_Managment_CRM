"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import { connectMongo } from "@/lib/mongodb";
import { CompanyModel, newId, toIso } from "@/lib/db/models";
import { companySchema } from "@/lib/validations";
import type { ActionResult } from "@/core/types/result";
import { PAGE_SIZE } from "@/lib/constants";

export async function getCompanies(params?: {
  page?: number;
  search?: string;
}) {
  await connectMongo();
  const page = params?.page ?? 1;
  const filter: Record<string, unknown> = { deleted_at: null };

  if (params?.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { industry: { $regex: params.search, $options: "i" } },
    ];
  }

  const count = await CompanyModel.countDocuments(filter);
  const rows = await CompanyModel.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return {
    data: rows.map((c) => ({
      ...c,
      created_at: toIso(c.created_at) ?? new Date().toISOString(),
      updated_at: toIso(c.updated_at) ?? new Date().toISOString(),
      deleted_at: toIso(c.deleted_at),
    })),
    count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  };
}

export async function getAllCompanies() {
  await connectMongo();
  const rows = await CompanyModel.find({ deleted_at: null })
    .sort({ name: 1 })
    .select("id name")
    .lean();
  return rows.map((c) => ({ id: c.id as string, name: c.name as string }));
}

export async function createCompanyAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "companies.manage")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website") || "",
    industry: formData.get("industry") || "",
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  const id = newId();
  await CompanyModel.create({
    id,
    ...parsed.data,
    website: parsed.data.website || null,
    email: parsed.data.email || null,
    created_by: profile.id,
  });

  await logActivity({
    action: "created",
    entity_type: "company",
    entity_id: id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/companies");
  return { success: true, data: { id } };
}

export async function updateCompanyAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "companies.manage")) {
    return { success: false, error: "Permission denied" };
  }

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website") || "",
    industry: formData.get("industry") || "",
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await connectMongo();
  await CompanyModel.updateOne(
    { id },
    {
      ...parsed.data,
      website: parsed.data.website || null,
      email: parsed.data.email || null,
    }
  );

  await logActivity({
    action: "updated",
    entity_type: "company",
    entity_id: id,
  });

  revalidatePath("/companies");
  return { success: true };
}

export async function softDeleteCompanyAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "companies.manage")) {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  await CompanyModel.updateOne({ id }, { deleted_at: new Date() });
  revalidatePath("/companies");
  return { success: true };
}
