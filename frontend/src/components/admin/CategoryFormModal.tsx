"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  createCategory,
  updateCategory,
  uploadProductImages,
  type CreateCategoryInput,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { prepareImagesForUpload } from "@/lib/imageUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  category?: Category | null;
  onSaved: () => void;
}

const emptyForm: CreateCategoryInput = {
  name: "",
  description: "",
  image: null,
  parent: null,
  isActive: true,
};

export function CategoryFormModal({
  isOpen,
  onClose,
  categories,
  category,
  onSaved,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<CreateCategoryInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(category);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (category) {
      setForm({
        name: category.name,
        description: category.description ?? "",
        image: category.image ?? null,
        parent: category.parent?.id ?? null,
        isActive: category.isActive,
      });
    } else {
      setForm(emptyForm);
    }

    setError(null);
    setLocalPreview(null);
  }, [isOpen, category]);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setError(null);

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setUploadingImage(true);

    try {
      const preparedFiles = await prepareImagesForUpload([file]);
      const data = await uploadProductImages(preparedFiles);
      const uploaded = data.images[0];

      if (uploaded) {
        setForm((current) => ({ ...current, image: uploaded }));
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to upload image",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setLocalPreview(null);
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = () => {
    setForm((current) => ({ ...current, image: null }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEditing && category) {
        await updateCategory(category.id, form);
      } else {
        await createCategory(form);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save category",
      );
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = categories.filter(
    (item) => !category || item.id !== category.id,
  );

  const previewUrl = localPreview ?? form.image?.url ?? null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit category" : "Add category"}
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
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleImageUpload(event.target.files)}
            disabled={uploadingImage}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-100"
          />

          {previewUrl ? (
            <div className="mt-3">
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Category preview"
                  className="h-full w-full object-cover"
                />
                {uploadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Spinner size="sm" label="Uploading image" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Parent category
          </label>
          <select
            value={form.parent ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                parent: event.target.value || null,
              }))
            }
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="">None</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
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
          <Button type="submit" disabled={saving || uploadingImage}>
            {saving ? (
              <>
                <Spinner size="sm" label="Saving" />
                Saving...
              </>
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create category"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
