"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import type { Cart } from "@/lib/api/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Spinner } from "@/components/ui/Spinner";

export default function CartPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncCart = useCartStore((state) => state.syncCart);
  const [hydrated, setHydrated] = useState(false);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCart();
      setCart(data.cart);
      syncCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [syncCart]);

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

    fetchCart();
  }, [hydrated, isAuthenticated, router, fetchCart]);

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const updateLocalQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      if (!current) {
        return current;
      }

      const items = current.items.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        return {
          ...item,
          quantity,
          lineTotal: item.price * quantity,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const nextCart = {
        ...current,
        items,
        totals: { subtotal, itemCount },
      };

      useCartStore.getState().syncCart(nextCart);

      return nextCart;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    updateLocalQuantity(productId, quantity);

    const existing = debounceTimers.current.get(productId);
    if (existing) {
      clearTimeout(existing);
    }

    debounceTimers.current.set(
      productId,
      setTimeout(async () => {
        setUpdatingIds((prev) => new Set(prev).add(productId));

        try {
          const data = await updateCartItem(productId, quantity);
          setCart(data.cart);
          syncCart(data.cart);
        } catch (err) {
          setError(
            err instanceof ApiError ? err.message : "Failed to update quantity",
          );
          await fetchCart();
        } finally {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      }, 500),
    );
  };

  const handleRemove = async (productId: string) => {
    const existing = debounceTimers.current.get(productId);
    if (existing) {
      clearTimeout(existing);
      debounceTimers.current.delete(productId);
    }

    setUpdatingIds((prev) => new Set(prev).add(productId));
    setError(null);

    try {
      const data = await removeCartItem(productId);
      setCart(data.cart);
      syncCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove item");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading cart" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-900">Shopping cart</h1>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isEmpty ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-zinc-600">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
          >
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <th className="px-4 py-3" scope="col">
                        Product
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Details
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Quantity
                      </th>
                      <th className="hidden px-4 py-3 sm:table-cell" scope="col">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="px-4">
                    {cart.items.map((item) => (
                      <CartItem
                        key={item.product.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                        updating={updatingIds.has(item.product.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              subtotal={cart.totals.subtotal}
              itemCount={cart.totals.itemCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}
