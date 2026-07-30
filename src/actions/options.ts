"use server";

import { connectMongo } from "@/lib/mongodb";
import { ClientModel, ProjectModel } from "@/lib/db/models";

export async function getClientOptions() {
  await connectMongo();
  const rows = await ClientModel.find({ deleted_at: null })
    .sort({ name: 1 })
    .select("id name")
    .lean();
  return rows.map((c) => ({ id: c.id as string, name: c.name as string }));
}

export async function getProjectOptions() {
  await connectMongo();
  const rows = await ProjectModel.find({ deleted_at: null })
    .sort({ name: 1 })
    .select("id name")
    .lean();
  return rows.map((p) => ({ id: p.id as string, name: p.name as string }));
}
