import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByIdServer } from "@/lib/api/orders.server";
import type { OrderItem } from "@/lib/api/types";
import {
  formatOrderDate,
  formatOrderStatus,
  truncateOrderId,
} from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { Badge, orderStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function getItemImage(item: OrderItem): string | null {
  if (item.image) {
    return item.image;
  }

  if (typeof item.product === "object" && item.product.images?.[0]?.url) {
    return item.product.images[0].url;
  }

  return null;
}

function getItemProductId(item: OrderItem): string | null {
  if (typeof item.product === "object") {
    return item.product.id;
  }

  return typeof item.product === "string" ? item.product : null;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  let order;
  try {
    const data = await getOrderByIdServer(id);
    order = data.order;
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/orders"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to orders
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900">
            Order {truncateOrderId(order.id)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={orderStatusVariant(order.orderStatus)}>
            {formatOrderStatus(order.orderStatus)}
          </Badge>
          <Badge variant={orderStatusVariant(order.paymentStatus)}>
            Payment: {formatOrderStatus(order.paymentStatus)}
          </Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Items</h2>
            <ul className="mt-6 divide-y divide-zinc-100">
              {order.items.map((item, index) => {
                const imageUrl = getItemImage(item);
                const productId = getItemProductId(item);

                return (
                  <li key={`${item.name}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          —
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {productId ? (
                        <Link
                          href={`/products/${productId}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="font-medium text-zinc-900">{item.name}</p>
                      )}
                      <p className="mt-1 text-sm text-zinc-500">
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
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Shipping address</h2>
            <address className="mt-4 not-italic text-sm leading-relaxed text-zinc-600">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zip}
              <br />
              {order.shippingAddress.country}
            </address>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Order total</h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600">Subtotal</dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Shipping</dt>
                <dd className="font-medium text-zinc-900">
                  {order.shippingCost === 0
                    ? "Free"
                    : formatPrice(order.shippingCost)}
                </dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Discount</dt>
                  <dd className="font-medium text-green-700">
                    −{formatPrice(order.discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base">
                <dt className="font-semibold text-zinc-900">Total</dt>
                <dd className="font-semibold text-zinc-900">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-zinc-500">
              Payment method: {order.paymentMethod}
            </p>

            <Link href="/orders" className="mt-6 block">
              <Button variant="outline" className="w-full">
                All orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
