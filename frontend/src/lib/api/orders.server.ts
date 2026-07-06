import { buildQueryString } from "./client";
import { serverApiRequest } from "./server";
import type { Order, PaginatedMeta } from "./types";
import type { GetMyOrdersParams } from "./orders";

interface OrdersResponse extends PaginatedMeta {
  success: true;
  orders: Order[];
}

interface OrderResponse {
  success: true;
  order: Order;
}

export async function getMyOrdersServer(
  params: GetMyOrdersParams = {},
): Promise<OrdersResponse> {
  return serverApiRequest<OrdersResponse>(
    `/orders/my-orders${buildQueryString(params)}`,
  );
}

export async function getOrderByIdServer(id: string): Promise<OrderResponse> {
  return serverApiRequest<OrderResponse>(`/orders/${id}`);
}
