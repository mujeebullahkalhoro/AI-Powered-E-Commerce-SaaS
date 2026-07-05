import { apiRequest } from "./client";
import type { Wishlist } from "./types";

interface WishlistResponse {
  success: true;
  wishlist: Wishlist;
}

export async function getWishlist(): Promise<WishlistResponse> {
  return apiRequest<WishlistResponse>("/wishlist");
}

export async function addToWishlist(
  productId: string,
): Promise<WishlistResponse> {
  return apiRequest<WishlistResponse>(`/wishlist/${productId}`, {
    method: "POST",
  });
}

export async function removeFromWishlist(
  productId: string,
): Promise<WishlistResponse> {
  return apiRequest<WishlistResponse>(`/wishlist/${productId}`, {
    method: "DELETE",
  });
}
