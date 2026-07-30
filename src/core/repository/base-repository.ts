export type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export type Paginated<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function toPaginated<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return {
    data,
    count,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
  };
}

/** Marker base for repositories (MongoDB implementations). */
export abstract class BaseRepository {}
