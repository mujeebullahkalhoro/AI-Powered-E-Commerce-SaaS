import { apiRequest } from "./client";
import type { Cart } from "./types";

interface CartResponse {
  success: true;
  cart: Cart;
}

export async function getCart(): Promise<CartResponse> {
  return apiRequest<CartResponse>("/cart");
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<CartResponse> {
  return apiRequest<CartResponse>("/cart/items", {
    method: "POST",
    body: { productId, quantity },
  });
}

export async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  return apiRequest<CartResponse>(`/cart/items/${productId}`, {
    method: "PUT",
    body: { quantity },
  });
}

export async function removeCartItem(productId: string): Promise<CartResponse> {
  return apiRequest<CartResponse>(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

export async function clearCart(): Promise<CartResponse> {
  return apiRequest<CartResponse>("/cart", {
    method: "DELETE",
  });
}
