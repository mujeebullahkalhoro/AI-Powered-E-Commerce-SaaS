"use client";

import { useCallback, useEffect, useState } from "react";
import { getInventoryReport, updateProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { InventoryProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";
import { Badge, stockStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [threshold, setThreshold] = useState(10);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInventoryReport();
      setProducts(data.products);
      setThreshold(data.threshold);
      setStockDrafts(
        Object.fromEntries(
          data.products.map((product) => [product.id, String(product.stock)]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleStockUpdate = async (productId: string) => {
    const value = Number(stockDrafts[productId]);

    if (!Number.isFinite(value) || value < 0) {
      setError("Stock must be a valid non-negative number");
      return;
    }

    setUpdatingId(productId);
    setError(null);

    try {
      await updateProduct(productId, { stock: value });
      await loadInventory();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update stock",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900">Inventory</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Active products with stock below {threshold}, sorted lowest first.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" label="Loading inventory" />
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-zinc-500">
          No low-stock products right now.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Sold</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Update stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const categoryName =
                    typeof product.category === "object"
                      ? product.category.name
                      : "—";

                  return (
                    <tr key={product.id} className="border-b border-zinc-100">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-zinc-500">{categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-zinc-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{product.sold}</td>
                      <td className="px-4 py-4">
                        <Badge variant={stockStatusVariant(product.stock)}>
                          {product.stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={stockDrafts[product.id] ?? ""}
                            onChange={(event) =>
                              setStockDrafts((current) => ({
                                ...current,
                                [product.id]: event.target.value,
                              }))
                            }
                            className="h-9 w-24 rounded-lg border border-zinc-300 px-2 text-sm text-zinc-900"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleStockUpdate(product.id)}
                            disabled={updatingId === product.id}
                          >
                            {updatingId === product.id ? "Saving..." : "Update"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
