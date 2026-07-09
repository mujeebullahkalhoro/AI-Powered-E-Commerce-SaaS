"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteCategory,
  getAdminCategories,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminCategories();
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (category: Category) => {
    if (
      !window.confirm(`Delete category "${category.name}"? This cannot be undone.`)
    ) {
      return;
    }

    setActionId(category.id);
    setError(null);

    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete category",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-zinc-900">Categories</h1>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
        >
          Add category
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" label="Loading categories" />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-zinc-100">
                    <td className="px-4 py-4 font-medium text-zinc-900">
                      {category.name}
                    </td>
                    <td className="px-4 py-4 text-zinc-600">{category.slug}</td>
                    <td className="px-4 py-4 text-zinc-600">
                      {category.parent?.name ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={category.isActive ? "success" : "neutral"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={actionId === category.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        category={editingCategory}
        onSaved={loadCategories}
      />
    </div>
  );
}
