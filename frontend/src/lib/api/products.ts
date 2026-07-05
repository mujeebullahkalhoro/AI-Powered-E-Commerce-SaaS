import { apiRequest, buildQueryString } from "./client";
import type { PaginatedMeta, Product } from "./types";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "rating";

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  search?: string;
}

interface ProductsResponse extends PaginatedMeta {
  success: true;
  products: Product[];
}

interface FeaturedProductsResponse {
  success: true;
  count: number;
  products: Product[];
}

interface ProductResponse {
  success: true;
  product: Product;
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(
    `/products${buildQueryString(params)}`,
    { auth: false },
  );
}

export async function getProductById(id: string): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/products/${id}`, { auth: false });
}

export async function getFeaturedProducts(): Promise<FeaturedProductsResponse> {
  return apiRequest<FeaturedProductsResponse>("/products/featured", {
    auth: false,
  });
}
