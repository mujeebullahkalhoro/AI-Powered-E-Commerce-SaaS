import { apiRequest } from "./client";
import type { Category } from "./types";

interface CategoriesResponse {
  success: true;
  count: number;
  categories: Category[];
}

interface CategoryResponse {
  success: true;
  category: Category;
}

export async function getCategories(): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>("/categories", { auth: false });
}

export async function getCategoryBySlug(slug: string): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/categories/${slug}`, { auth: false });
}
