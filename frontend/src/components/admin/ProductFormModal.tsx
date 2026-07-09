"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  createProduct,
  generateProductDescription,
  generateProductSeo,
  generateProductTags,
  updateProduct,
  uploadProductImages,
  type CreateProductInput,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { Category, Product, ProductImage } from "@/lib/api/types";
import {
  prepareImagesForUpload,
} from "@/lib/imageUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

interface LocalImagePreview {
  id: string;
  url: string;
  name: string;
}

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  product?: Product | null;
  onSaved: () => void;
}

const emptyForm: CreateProductInput = {
  name: "",
  description: "",
  price: 0,
  comparePrice: undefined,
  category: "",
  stock: 0,
  images: [],
  tags: [],
  seoTitle: "",
  metaDescription: "",
  isActive: true,
};

export function ProductFormModal({
  isOpen,
  onClose,
  categories,
  product,
  onSaved,
}: ProductFormModalProps) {
  const [form, setForm] = useState<CreateProductInput>(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<LocalImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(product);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        category:
          typeof product.category === "object"
            ? product.category.id
            : String(product.category),
        stock: product.stock,
        images: product.images,
        tags: product.tags,
        seoTitle: product.seoTitle ?? "",
        metaDescription: product.metaDescription ?? "",
        isActive: product.isActive,
      });
      setTagsInput(product.tags.join(", "));
    } else {
      setForm({
        ...emptyForm,
        category: categories[0]?.id ?? "",
      });
      setTagsInput("");
    }

    setError(null);
    setLocalPreviews([]);
  }, [isOpen, product, categories]);

  useEffect(() => {
    return () => {
      localPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [localPreviews]);

  const clearLocalPreviews = (previews: LocalImagePreview[]) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setLocalPreviews([]);
  };

  const categoryName =
    categories.find((category) => category.id === form.category)?.name ?? "";

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setError(null);

    const selectedFiles = Array.from(files);
    const previews = selectedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setLocalPreviews(previews);
    setUploadingImages(true);

    try {
      const preparedFiles = await prepareImagesForUpload(selectedFiles);
      const data = await uploadProductImages(preparedFiles);
      setForm((current) => ({
        ...current,
        images: [...(current.images ?? []), ...data.images],
      }));
      clearLocalPreviews(previews);
    } catch (err) {
      clearLocalPreviews(previews);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to upload images");
      }
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (publicId: string) => {
    setForm((current) => ({
      ...current,
      images: (current.images ?? []).filter(
        (image) => image.publicId !== publicId,
      ),
    }));
  };

  const handleGenerateDescription = async () => {
    if (!form.name || !categoryName) {
      setError("Name and category are required for AI generation");
      return;
    }

    setAiLoading("description");
    setError(null);

    try {
      const data = await generateProductDescription({
        name: form.name,
        category: categoryName,
        attributes: form.tags,
      });
      setForm((current) => ({ ...current, description: data.description }));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to generate description",
      );
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateSeo = async () => {
    if (!form.name || !form.description || !categoryName) {
      setError("Name, description, and category are required for AI generation");
      return;
    }

    setAiLoading("seo");
    setError(null);

    try {
      const data = await generateProductSeo({
        name: form.name,
        description: form.description,
        category: categoryName,
      });
      setForm((current) => ({
        ...current,
        seoTitle: data.seoTitle,
        metaDescription: data.metaDescription,
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate SEO");
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateTags = async () => {
    if (!form.name || !form.description || !categoryName) {
      setError("Name, description, and category are required for AI generation");
      return;
    }

    setAiLoading("tags");
    setError(null);

    try {
      const data = await generateProductTags({
        name: form.name,
        description: form.description,
        category: categoryName,
      });
      setForm((current) => ({ ...current, tags: data.tags }));
      setTagsInput(data.tags.join(", "));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate tags");
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: CreateProductInput = {
      ...form,
      tags,
      comparePrice: form.comparePrice || undefined,
      seoTitle: form.seoTitle || undefined,
      metaDescription: form.metaDescription || undefined,
    };

    try {
      if (isEditing && product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit product" : "Add product"}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-zinc-700">Description</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={aiLoading !== null}
            >
              {aiLoading === "description" ? "Generating..." : "Generate description"}
            </Button>
          </div>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                price: Number(event.target.value),
              }))
            }
            required
          />
          <Input
            label="Compare price"
            type="number"
            min="0"
            step="0.01"
            value={form.comparePrice ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                comparePrice: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Category
            </label>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              required
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="">Select category</option>
              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                stock: Number(event.target.value),
              }))
            }
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-zinc-700">Tags</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateTags}
              disabled={aiLoading !== null}
            >
              {aiLoading === "tags" ? "Generating..." : "Generate tags"}
            </Button>
          </div>
          <Input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="comma, separated, tags"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="SEO title"
            value={form.seoTitle ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, seoTitle: event.target.value }))
            }
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSeo}
              disabled={aiLoading !== null}
              className="w-full"
            >
              {aiLoading === "seo" ? "Generating..." : "Generate SEO"}
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Meta description
          </label>
          <textarea
            value={form.metaDescription ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                metaDescription: event.target.value,
              }))
            }
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Images
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => void handleImageUpload(event.target.files)}
            disabled={uploadingImages}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-100"
          />
          {uploadingImages ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
              <Spinner size="sm" label="Uploading image" />
              <span>Uploading image...</span>
            </div>
          ) : null}

          {(localPreviews.length > 0 || (form.images ?? []).length > 0) && (
            <div className="mt-3 flex flex-wrap gap-3">
              {localPreviews.map((preview) => (
                <div
                  key={preview.id}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Spinner size="sm" label="Uploading image" />
                  </div>
                </div>
              ))}

              {(form.images ?? []).map((image: ProductImage) => (
                <div
                  key={image.publicId}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.publicId)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
            className="rounded border-zinc-300"
          />
          Active
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" label="Saving" />
                Saving...
              </>
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create product"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
