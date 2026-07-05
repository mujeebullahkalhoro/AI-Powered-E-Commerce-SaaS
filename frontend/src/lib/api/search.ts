import { apiRequest, buildQueryString } from "./client";
import type { SearchProductResult } from "./types";

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

interface SearchResponse {
  success: true;
  query: string;
  count: number;
  products: SearchProductResult[];
}

export async function search(
  query: string,
  filters: SearchFilters = {},
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(
    `/search${buildQueryString({ q: query, ...filters })}`,
    { auth: false },
  );
}
