import type { Product, ProductCategory } from "@/lib/api/types";

export function getCategoryFromProduct(
  category: ProductCategory | string,
): ProductCategory | null {
  if (typeof category === "object" && category !== null && "slug" in category) {
    return category;
  }

  return null;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getProductImageUrl(
  product: Product,
  index = 0,
): string | null {
  return product.images[index]?.url ?? null;
}
