import { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getClients } from "@/actions/clients";
import { apiOk, handleApiError } from "@/core/http/api-response";
import { AppError } from "@/core/types/result";
import { enforceRateLimit } from "@/core/security/enforce-rate-limit";

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentProfile();
    if (!actor) throw new AppError("UNAUTHORIZED", "Authentication required");

    enforceRateLimit(`api:clients:list:${actor.id}`, {
      limit: 60,
      windowMs: 60_000,
    });

    const { searchParams } = request.nextUrl;
    const result = await getClients({
      page: Number(searchParams.get("page") || 1),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: (searchParams.get("order") as "asc" | "desc" | null) ?? undefined,
    });

    return apiOk(result.data, {
      meta: {
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
