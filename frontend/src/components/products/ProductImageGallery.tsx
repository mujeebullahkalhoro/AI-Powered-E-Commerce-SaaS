"use client";

import { useState } from "react";
import type { ProductImage as ProductImageType } from "@/lib/api/types";
import { ProductImage } from "./ProductImage";

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImageType[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
        <ProductImage
          src={activeImage.url}
          alt={productName}
          fill
          className="object-contain p-4"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex
                  ? "border-zinc-900"
                  : "border-transparent ring-1 ring-zinc-200"
              }`}
            >
              <ProductImage
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
