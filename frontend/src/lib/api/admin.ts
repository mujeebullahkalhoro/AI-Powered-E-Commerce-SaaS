import { apiRequest, buildQueryString } from "./client";
import type {
  DashboardStats,
  InventoryProduct,
  Order,
  OrderStatus,
  PaginatedMeta,
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
