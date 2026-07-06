"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { addToCart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import type { Product, WishlistProduct } from "@/lib/api/types";
import {
  getWishlist,
  removeFromWishlist,
} from "@/lib/api/wishlist";
import { useAuthStore } from "@/store/authStore";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

function wishlistProductToProduct(product: WishlistProduct): Product {
  return {
    id: product.id,
    name: product.name,
    description: "",
    price: product.price,
    images: product.images,
    category: "",
    stock: product.isActive ? 999 : 0,
    sold: 0,
    tags: [],
    averageRating: 0,
    reviewCount: 0,
    isActive: product.isActive,
    createdAt: "",
    updatedAt: "",
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getWishlist();
      setProducts(data.wishlist.products);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load wishlist",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    fetchWishlist();
  }, [hydrated, isAuthenticated, router, fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setActionId(productId);
    setError(null);

    try {
      const data = await removeFromWishlist(productId);
      setProducts(data.wishlist.products);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to remove from wishlist",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleMoveToCart = async (productId: string) => {
    setActionId(productId);
    setError(null);

    try {
      await addToCart(productId, 1);
      const data = await removeFromWishlist(productId);
      setProducts(data.wishlist.products);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to move item to cart",
      );
    } finally {
      setActionId(null);
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading wishlist" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isEmpty = products.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-900">Wishlist</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {products.length} {products.length === 1 ? "item" : "items"} saved
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isEmpty ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-zinc-600">Your wishlist is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
          >
            Browse products →
          </Link>
        </div>
      ) : (
        <ProductGrid className="mt-8">
          {products.map((product) => {
            const isBusy = actionId === product.id;

            return (
              <div key={product.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  disabled={isBusy}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-zinc-600 shadow-sm transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <RemoveIcon />
                </button>

                <ProductCard
                  product={wishlistProductToProduct(product)}
                  footerActions={
                    <Button
                      size="sm"
                      className="mt-auto w-full"
                      onClick={() => handleMoveToCart(product.id)}
                      disabled={isBusy || !product.isActive}
                    >
                      {isBusy
                        ? "Moving..."
                        : !product.isActive
                          ? "Unavailable"
                          : "Move to cart"}
                    </Button>
                  }
                />
              </div>
            );
          })}
        </ProductGrid>
      )}
    </div>
  );
}

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
