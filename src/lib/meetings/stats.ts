export type MeetingCountRow = {
  id: string;
  name: string;
  total: number;
  upcoming: number;
  past: number;
};

export function summarizeMeetingsByParty(
  meetings: Array<{
    manager_id?: string | null;
    manager?: { id: string; full_name: string } | null;
    manager_name?: string | null;
    client_id?: string | null;
    client?: { id: string; name: string } | null;
    status: string;
  }>
) {
  const byManager = new Map<string, MeetingCountRow>();
  const byClient = new Map<string, MeetingCountRow>();

  for (const m of meetings) {
    const upcoming = m.status === "scheduled";
    const managerKey = m.manager_id || m.manager?.id || "unassigned";
    const managerName =
      m.manager?.full_name || m.manager_name || "Unassigned manager";
    const managerRow = byManager.get(managerKey) ?? {
      id: managerKey,
      name: managerName,
      total: 0,
      upcoming: 0,
      past: 0,
    };
    managerRow.total += 1;
    if (upcoming) managerRow.upcoming += 1;
    else managerRow.past += 1;
    byManager.set(managerKey, managerRow);

    const clientKey = m.client_id || m.client?.id || "unknown";
    const clientName = m.client?.name || "Unknown client";
    const clientRow = byClient.get(clientKey) ?? {
      id: clientKey,
      name: clientName,
      total: 0,
      upcoming: 0,
      past: 0,
    };
    clientRow.total += 1;
    if (upcoming) clientRow.upcoming += 1;
    else clientRow.past += 1;
    byClient.set(clientKey, clientRow);
  }

  const sortFn = (a: MeetingCountRow, b: MeetingCountRow) =>
    b.total - a.total || a.name.localeCompare(b.name);

  return {
    byManager: [...byManager.values()].sort(sortFn),
    byClient: [...byClient.values()].sort(sortFn),
  };
}
