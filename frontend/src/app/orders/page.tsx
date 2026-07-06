import Link from "next/link";
import { Suspense } from "react";
import { getMyOrdersServer } from "@/lib/api/orders.server";
import {
  formatOrderDate,
  formatOrderStatus,
  truncateOrderId,
} from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { OrdersPagination } from "@/components/orders/OrdersPagination";
import { Badge, orderStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    success?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const showSuccess = params.success === "1";

  const data = await getMyOrdersServer({ page, limit: 10 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-900">My orders</h1>

      {showSuccess ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payment successful! Your order has been placed and will appear below
          shortly.
        </div>
      ) : null}

      {data.orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-zinc-600">You have no orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
          >
            Start shopping →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3" scope="col">
                      Order
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Date
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Total
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right" scope="col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-4 font-medium text-zinc-900">
                        {truncateOrderId(order.id)}
                      </td>
                      <td className="px-4 py-4 text-zinc-600">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-medium text-zinc-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={orderStatusVariant(order.orderStatus)}>
                          {formatOrderStatus(order.orderStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Suspense fallback={<Spinner className="mt-10" label="Loading pagination" />}>
            <OrdersPagination currentPage={data.page} totalPages={data.pages} />
          </Suspense>
        </>
      )}
    </div>
  );
}
