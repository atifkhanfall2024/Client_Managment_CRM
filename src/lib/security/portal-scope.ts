/**
 * Pure helpers for portal / meeting isolation (unit-testable).
 */

export function isMeetingVisibleToClient(params: {
  meetingClientId: string;
  portalClientId: string;
  visibleToClient?: boolean | null;
  deletedAt?: Date | string | null;
}): boolean {
  if (params.deletedAt) return false;
  if (params.meetingClientId !== params.portalClientId) return false;
  if (params.visibleToClient === false) return false;
  return true;
}

export function filterProjectsForClient<T extends { client_id: string }>(
  projects: T[],
  clientId: string
): T[] {
  return projects.filter((p) => p.client_id === clientId);
}

/** Clamp pagination for high-traffic list endpoints. */
export function safePageParams(input: {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
}) {
  const maxPageSize = input.maxPageSize ?? 50;
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, Math.floor(input.pageSize ?? 20))
  );
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function assertStaffOnlyRole(role: string): boolean {
  return role !== "client";
}
