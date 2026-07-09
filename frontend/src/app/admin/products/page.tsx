"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteProduct,
  getAdminCategories,
  getAdminProducts,
  updateProduct,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { Category, Product } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsData, categoriesData] = await Promise.all([
        getAdminProducts({
          page,
          limit: 20,
          search: search || undefined,
          includeInactive: showInactive,
        }),
        getAdminCategories(),
      ]);
      setProducts(productsData.products);
      setPages(productsData.pages);
      setCategories(categoriesData.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, showInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleActive = async (product: Product) => {
    setActionId(product.id);
    setError(null);

    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update product status",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !window.confirm(
        `Remove "${product.name}" from the store? If it is the last product in its category, the category will be removed too.`,
      )
    ) {
      return;
    }

    setActionId(product.id);
    setError(null);

    try {
      await deleteProduct(product.id);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete product");
    } finally {
      setActionId(null);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-zinc-900">Products</h1>
        <Button onClick={openCreate}>Add product</Button>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex max-w-md flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search products..."
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => {
              setPage(1);
              setShowInactive(event.target.checked);
            }}
            className="rounded border-zinc-300"
          />
          Show removed
        </label>
      </form>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" label="Loading products" />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const imageUrl = product.images[0]?.url ?? null;
                    const categoryName =
                      typeof product.category === "object"
                        ? product.category.name
                        : "—";
                    const isBusy = actionId === product.id;

                    return (
                      <tr key={product.id} className="border-b border-zinc-100">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : null}
                            </div>
                            <span className="font-medium text-zinc-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-zinc-600">{categoryName}</td>
                        <td className="px-4 py-4 font-medium text-zinc-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-4 text-zinc-600">{product.stock}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(product)}
                            disabled={isBusy}
                          >
                            <Badge variant={product.isActive ? "success" : "neutral"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(product)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(product)}
                              disabled={isBusy}
                            >
                              Delete
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

          <Pagination
            currentPage={page}
            totalPages={pages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        product={editingProduct}
        onSaved={loadData}
      />
    </div>
  );
}
