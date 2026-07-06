import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { Button } from "@/components/ui/Button";

const SHIPPING_FLAT_RATE = 5;
const FREE_SHIPPING_THRESHOLD = 50;

export interface OrderSummaryProps {
  subtotal: number;
  itemCount: number;
}

function calculateShipping(subtotal: number): number {
  return subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FLAT_RATE : 0;
}

export function OrderSummary({ subtotal, itemCount }: OrderSummaryProps) {
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;
  const isEmpty = itemCount === 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Order summary</h2>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-600">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium text-zinc-900">{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-zinc-600">Shipping</dt>
          <dd className="font-medium text-zinc-900">
            {shipping === 0 ? "Free" : formatPrice(shipping)}
          </dd>
        </div>

        {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? (
          <p className="text-xs text-zinc-500">
            Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}
          </p>
        ) : null}
      </dl>

      <div className="mt-6 flex justify-between border-t border-zinc-200 pt-4">
        <span className="text-base font-semibold text-zinc-900">Total</span>
        <span className="text-base font-semibold text-zinc-900">
          {formatPrice(total)}
        </span>
      </div>

      <Link href="/checkout" className="mt-6 block">
        <Button size="lg" className="w-full" disabled={isEmpty}>
          Proceed to checkout
        </Button>
      </Link>
    </div>
  );
}
