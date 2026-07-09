import {
  apiFormRequest,
  apiRequest,
  buildQueryString,
} from "./client";
import type {
  Category,
  DashboardStats,
  InventoryProduct,
  Order,
  OrderStatus,
  PaginatedMeta,
  Product,
  ProductImage,
  User,
  UserRole,
} from "./types";

interface DashboardResponse {
  success: true;
  stats: DashboardStats;
}

interface UsersResponse extends PaginatedMeta {
  success: true;
  users: User[];
}

interface UserStatusResponse {
  success: true;
  user: User;
}

interface OrdersResponse extends PaginatedMeta {
  success: true;
  orders: Order[];
}

interface OrderStatusUpdateResponse {
  success: true;
  order: {
    id: string;
    orderStatus: OrderStatus;
    updatedAt: string;
  };
}

interface InventoryResponse {
  success: true;
  threshold: number;
  count: number;
  products: InventoryProduct[];
}

interface ProductsResponse extends PaginatedMeta {
  success: true;
  products: Product[];
}

interface ProductResponse {
  success: true;
  product: Product;
}

interface CategoriesResponse {
  success: true;
  count: number;
  categories: Category[];
}

interface CategoryResponse {
  success: true;
  category: Category;
}

interface MessageResponse {
  success: true;
  message: string;
}

interface UploadImagesResponse {
  success: true;
  count: number;
  images: ProductImage[];
}

interface GenerateDescriptionResponse {
  success: true;
  description: string;
}

interface GenerateSeoResponse {
  success: true;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}

interface GenerateTagsResponse {
  success: true;
  tags: string[];
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface GetAllOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface GetAdminProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images?: ProductImage[];
  category: string;
  stock: number;
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface CreateCategoryInput {
  name: string;
  description?: string;
  image?: ProductImage | null;
  parent?: string | null;
  isActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export async function getDashboardStats(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/admin/dashboard");
}

export async function getAllUsers(
  params: GetAllUsersParams = {},
): Promise<UsersResponse> {
  return apiRequest<UsersResponse>(
    `/admin/users${buildQueryString(params)}`,
  );
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
): Promise<UserStatusResponse> {
  return apiRequest<UserStatusResponse>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

export async function getAllOrders(
  params: GetAllOrdersParams = {},
): Promise<OrdersResponse> {
  return apiRequest<OrdersResponse>(
    `/admin/orders${buildQueryString(params)}`,
  );
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
): Promise<OrderStatusUpdateResponse> {
  return apiRequest<OrderStatusUpdateResponse>(
    `/admin/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: { orderStatus },
    },
  );
}

export async function getInventoryReport(): Promise<InventoryResponse> {
  return apiRequest<InventoryResponse>("/admin/inventory");
}

export async function getAdminProducts(
  params: GetAdminProductsParams = {},
): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(
    `/admin/products${buildQueryString(params)}`,
  );
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  return apiRequest<ProductResponse>("/products", {
    method: "POST",
    body: input,
  });
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/products/${productId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteProduct(
  productId: string,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(`/products/${productId}`, {
    method: "DELETE",
  });
}

export async function getAdminCategories(): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>("/admin/categories");
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>("/categories", {
    method: "POST",
    body: input,
  });
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/categories/${categoryId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteCategory(
  categoryId: string,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export async function uploadProductImages(
  files: File[],
): Promise<UploadImagesResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  return apiFormRequest<UploadImagesResponse>("/upload/images", formData);
}

export async function generateProductDescription(input: {
  name: string;
  category: string;
  attributes?: string[];
}): Promise<GenerateDescriptionResponse> {
  return apiRequest<GenerateDescriptionResponse>("/ai/description", {
    method: "POST",
    body: input,
  });
}

export async function generateProductSeo(input: {
  name: string;
  description: string;
  category: string;
}): Promise<GenerateSeoResponse> {
  return apiRequest<GenerateSeoResponse>("/ai/seo", {
    method: "POST",
    body: input,
  });
}

export async function generateProductTags(input: {
  name: string;
  description: string;
  category: string;
}): Promise<GenerateTagsResponse> {
  return apiRequest<GenerateTagsResponse>("/ai/tags", {
    method: "POST",
    body: input,
  });
}
