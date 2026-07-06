import Image from "next/image";
import type { CartItem } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";

export interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export function CheckoutSummary({
  items,
  subtotal,
  shippingCost,
  total,
}: CheckoutSummaryProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Order summary</h2>

      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const imageUrl = item.product.images[0]?.url ?? null;

          return (
            <li key={item.product.id} className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {item.product.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Qty {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-900">
                {formatPrice(item.lineTotal)}
              </p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-600">Subtotal</dt>
          <dd className="font-medium text-zinc-900">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-600">Shipping</dt>
          <dd className="font-medium text-zinc-900">
            {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-3 text-base">
          <dt className="font-semibold text-zinc-900">Total</dt>
          <dd className="font-semibold text-zinc-900">{formatPrice(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
