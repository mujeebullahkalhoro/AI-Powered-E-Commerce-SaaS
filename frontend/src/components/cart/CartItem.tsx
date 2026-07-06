"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem as CartItemType } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";
import { Button } from "@/components/ui/Button";

export interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  updating?: boolean;
}

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  updating = false,
}: CartItemProps) {
  const { product, quantity, price, lineTotal } = item;
  const imageUrl = product.images[0]?.url ?? null;
  const maxQuantity = product.stock;

  const decrease = () => {
    if (quantity > 1) {
      onQuantityChange(product.id, quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(product.id, quantity + 1);
    }
  };

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-4 pr-4">
        <Link
          href={`/products/${product.id}`}
          className="relative block h-20 w-20 overflow-hidden rounded-lg bg-zinc-100"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              No image
            </div>
          )}
        </Link>
      </td>

      <td className="px-4 py-4 pr-4">
        <Link
          href={`/products/${product.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-zinc-500">{formatPrice(price)} each</p>
      </td>

      <td className="px-4 py-4 pr-4">
        <div className="inline-flex items-center rounded-lg border border-zinc-200">
          <button
            type="button"
            onClick={decrease}
            disabled={updating || quantity <= 1}
            className="flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="flex h-9 min-w-9 items-center justify-center border-x border-zinc-200 px-2 text-sm font-medium text-zinc-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increase}
            disabled={updating || quantity >= maxQuantity}
            className="flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {quantity >= maxQuantity ? (
          <p className="mt-1 text-xs text-zinc-500">Max stock reached</p>
        ) : null}
      </td>

      <td className="hidden px-4 py-4 text-right font-medium text-zinc-900 sm:table-cell">
        {formatPrice(lineTotal)}
      </td>

      <td className="px-4 py-4 text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(product.id)}
          disabled={updating}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}
