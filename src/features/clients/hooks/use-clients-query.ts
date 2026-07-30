"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/core/http/api-response";
import type { Client } from "@/types/database";

type ClientsMeta = {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function fetchClients(params: {
  page?: number;
  search?: string;
  status?: string;
  priority?: string;
  sort?: string;
  order?: string;
}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });

  const res = await fetch(`/api/clients?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Client[]> & {
    meta?: ClientsMeta;
  };

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return { data: json.data, meta: json.meta };
}

/** TanStack Query hook — client-side refetch/cache for interactive lists. */
export function useClientsQuery(params: {
  page?: number;
  search?: string;
  status?: string;
  priority?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => fetchClients(params),
  });
}
