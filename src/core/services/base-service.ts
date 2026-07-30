import type { Profile } from "@/types/database";
import type { Permission } from "@/lib/rbac";
import { hasPermission } from "@/lib/rbac";
import { AppError } from "@/core/types/result";

/**
 * Base service — orchestrates repositories + domain rules.
 * Authorization checks live here (or in a dedicated Policy), not in UI.
 */
export abstract class BaseService {
  protected requirePermission(actor: Profile, permission: Permission) {
    if (!hasPermission(actor.role, permission)) {
      throw new AppError("FORBIDDEN", "You do not have permission for this action");
    }
  }

  protected requireAuth(actor: Profile | null): asserts actor is Profile {
    if (!actor) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
  }
}
