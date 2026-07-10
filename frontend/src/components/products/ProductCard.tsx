"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { addToCart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { addToWishlist } from "@/lib/api/wishlist";
import type { Product } from "@/lib/api/types";
import { formatPrice, getProductImageUrl } from "@/lib/products";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "./ProductImage";
import { RatingStars } from "./RatingStars";

export interface ProductCardProps {
  product: Product;
  footerActions?: ReactNode;
}

export function ProductCard({ product, footerActions }: ProductCardProps) {
  const router = useRouter();
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncCart = useCartStore((state) => state.syncCart);
  const imageUrl = getProductImageUrl(product);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setCartLoading(true);
    setMessage(null);

    try {
      const data = await addToCart(product.id, 1);
      syncCart(data.cart);
      setMessage("Added to cart");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Could not add to cart",
      );
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setWishlistLoading(true);
    setMessage(null);

    try {
      await addToWishlist(product.id);
      setMessage("Added to wishlist");
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Could not add to wishlist",
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:underline">
              {product.name}
            </h3>
          </Link>
          {!footerActions ? (
            <button
              type="button"
              onClick={handleAddToWishlist}
              disabled={wishlistLoading}
              className="shrink-0 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-500 disabled:opacity-50"
              aria-label="Add to wishlist"
            >
              <HeartIcon filled={false} />
            </button>
          ) : null}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <RatingStars rating={product.averageRating} size="sm" />
          <span className="text-xs text-zinc-500">({product.reviewCount})</span>
        </div>

        <p className="mb-4 text-lg font-bold text-zinc-900">
          {formatPrice(product.price)}
        </p>

        {footerActions ?? (
          <>
            <Button
              size="sm"
              className="mt-auto w-full"
              onClick={handleAddToCart}
              disabled={cartLoading || product.stock < 1}
            >
              {product.stock < 1
                ? "Out of stock"
                : cartLoading
                  ? "Adding..."
                  : "Add to cart"}
            </Button>

            {message ? (
              <p className="mt-2 text-center text-xs text-zinc-500">{message}</p>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"
      />
    </svg>
  );
}
