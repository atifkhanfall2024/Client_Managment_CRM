import type { Profile, Client } from "@/types/database";
import type { ClientInput } from "@/lib/validations";
import { BaseService } from "@/core/services/base-service";
import { ClientRepository } from "@/features/clients/repository/client-repository";
import { logActivity, createNotification } from "@/lib/activity";
import type { Paginated } from "@/core/repository/base-repository";
import type { ClientListFilters } from "@/features/clients/repository/client-repository";
import { newId } from "@/lib/db/models";

export class ClientService extends BaseService {
  private readonly repo = new ClientRepository();

  list(actor: Profile, filters?: ClientListFilters): Promise<Paginated<Client>> {
    this.requirePermission(actor, "clients.view");
    return this.repo.list(filters);
  }

  get(actor: Profile, id: string): Promise<Client> {
    this.requirePermission(actor, "clients.view");
    return this.repo.findById(id);
  }

  async create(actor: Profile, input: ClientInput): Promise<Client> {
    this.requirePermission(actor, "clients.create");

    const client = await this.repo.create({
      id: newId(),
      ...input,
      company_id: input.company_id || null,
      assigned_manager_id: input.assigned_manager_id || null,
      deadline: input.deadline || null,
      email: input.email || null,
      website: input.website || null,
      created_by: actor.id,
    });

    await logActivity({
      action: "created",
      entity_type: "client",
      entity_id: client.id,
      metadata: { name: client.name },
    });

    if (client.assigned_manager_id) {
      await createNotification({
        user_id: client.assigned_manager_id,
        title: "New client assigned",
        message: `You were assigned to client ${client.name}`,
        link: `/clients/${client.id}`,
      });
    }

    return client;
  }

  async update(actor: Profile, id: string, input: ClientInput): Promise<Client> {
    this.requirePermission(actor, "clients.update");

    const client = await this.repo.update(id, {
      ...input,
      company_id: input.company_id || null,
      assigned_manager_id: input.assigned_manager_id || null,
      deadline: input.deadline || null,
      email: input.email || null,
      website: input.website || null,
    });

    await logActivity({
      action: "updated",
      entity_type: "client",
      entity_id: id,
      metadata: { name: client.name },
    });

    return client;
  }

  async softDelete(actor: Profile, id: string): Promise<void> {
    this.requirePermission(actor, "clients.delete");
    await this.repo.softDelete(id);
    await logActivity({
      action: "soft_deleted",
      entity_type: "client",
      entity_id: id,
    });
  }
}
