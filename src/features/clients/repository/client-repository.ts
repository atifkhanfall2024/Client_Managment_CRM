import { connectMongo } from "@/lib/mongodb";
import { ClientModel } from "@/lib/db/models";
import {
  toPaginated,
  type ListParams,
  type Paginated,
} from "@/core/repository/base-repository";
import { AppError } from "@/core/types/result";
import type { Client } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";
import { toIso } from "@/lib/db/models";

export type ClientListFilters = ListParams & {
  status?: string;
  priority?: string;
};

export class ClientRepository {
  async list(filters: ClientListFilters = {}): Promise<Paginated<Client>> {
    await connectMongo();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PAGE_SIZE;
    const filter: Record<string, unknown> = { deleted_at: null };

    if (filters.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }
    if (filters.status) filter.status = filters.status;
    if (filters.priority) filter.priority = filters.priority;

    const sortField = filters.sort || "created_at";
    const sortDir = filters.order === "asc" ? 1 : -1;
    const count = await ClientModel.countDocuments(filter);
    const rows = await ClientModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const data = rows.map((c) => ({
      ...(c as unknown as Client),
      created_at: toIso(c.created_at) ?? new Date().toISOString(),
      updated_at: toIso(c.updated_at) ?? new Date().toISOString(),
      deleted_at: toIso(c.deleted_at),
    })) as Client[];

    return toPaginated(data, count, page, pageSize);
  }

  async findById(id: string): Promise<Client> {
    await connectMongo();
    const client = await ClientModel.findOne({ id, deleted_at: null }).lean();
    if (!client) throw new AppError("NOT_FOUND", "Client not found");
    return {
      ...(client as unknown as Client),
      created_at: toIso(client.created_at) ?? new Date().toISOString(),
      updated_at: toIso(client.updated_at) ?? new Date().toISOString(),
      deleted_at: toIso(client.deleted_at),
    };
  }

  async create(payload: Record<string, unknown>): Promise<Client> {
    await connectMongo();
    const created = await ClientModel.create(payload);
    const obj = created.toObject();
    return {
      ...(obj as unknown as Client),
      created_at: toIso(obj.created_at) ?? new Date().toISOString(),
      updated_at: toIso(obj.updated_at) ?? new Date().toISOString(),
      deleted_at: null,
    };
  }

  async update(id: string, payload: Record<string, unknown>): Promise<Client> {
    await connectMongo();
    const updated = await ClientModel.findOneAndUpdate({ id }, payload, {
      new: true,
    }).lean();
    if (!updated) throw new AppError("NOT_FOUND", "Client not found");
    return {
      ...(updated as unknown as Client),
      created_at: toIso(updated.created_at) ?? new Date().toISOString(),
      updated_at: toIso(updated.updated_at) ?? new Date().toISOString(),
      deleted_at: toIso(updated.deleted_at),
    };
  }

  async softDelete(id: string): Promise<void> {
    await connectMongo();
    await ClientModel.updateOne({ id }, { deleted_at: new Date() });
  }
}
