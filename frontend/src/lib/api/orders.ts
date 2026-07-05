import { apiRequest, buildQueryString } from "./client";
import type { Order, PaginatedMeta, ShippingAddress } from "./types";

export interface CreatePaymentIntentInput {
  shippingAddress: ShippingAddress;
  paymentMethod?: string;
}

interface PaymentIntentResponse {
  success: true;
  clientSecret: string;
  subtotal: number;
  shippingCost: number;
  total: number;
}

interface OrdersResponse extends PaginatedMeta {
  success: true;
  orders: Order[];
}

interface OrderResponse {
  success: true;
  order: Order;
}

export interface GetMyOrdersParams {
  page?: number;
  limit?: number;
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResponse> {
  return apiRequest<PaymentIntentResponse>("/orders/create-payment-intent", {
    method: "POST",
    body: input,
  });
}

export async function getMyOrders(
  params: GetMyOrdersParams = {},
): Promise<OrdersResponse> {
  return apiRequest<OrdersResponse>(
    `/orders/my-orders${buildQueryString(params)}`,
  );
}

export async function getOrderById(id: string): Promise<OrderResponse> {
  return apiRequest<OrderResponse>(`/orders/${id}`);
}
