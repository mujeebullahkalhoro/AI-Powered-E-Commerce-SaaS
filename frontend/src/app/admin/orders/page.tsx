"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/api/admin";
import { getAllowedOrderStatuses, ORDER_STATUSES } from "@/lib/admin/orders";
import { ApiError } from "@/lib/api/client";
import type { Order, OrderStatus } from "@/lib/api/types";
import { formatOrderDate, formatOrderStatus, truncateOrderId } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { Badge, orderStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllOrders({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setOrders(data.orders);
      setPages(data.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, orderStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError(null);

    try {
      await updateOrderStatus(orderId, orderStatus);
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update order status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs: { label: string; value: OrderStatus | "all" }[] = [
    { label: "All", value: "all" },
    ...ORDER_STATUSES.map((status) => ({
      label: formatOrderStatus(status),
      value: status,
    })),
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setPage(1);
              setStatusFilter(tab.value);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" label="Loading orders" />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Update status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const customer =
                      typeof order.user === "object" ? order.user.name : "—";
                    const allowedStatuses = getAllowedOrderStatuses(
                      order.orderStatus,
                    );

                    return (
                      <tr key={order.id} className="border-b border-zinc-100">
                        <td className="px-4 py-4 font-medium text-zinc-900">
                          {truncateOrderId(order.id)}
                        </td>
                        <td className="px-4 py-4 text-zinc-600">{customer}</td>
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
                        <td className="px-4 py-4">
                          <select
                            value={order.orderStatus}
                            disabled={updatingId === order.id}
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value as OrderStatus,
                              )
                            }
                            className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
                          >
                            {allowedStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatOrderStatus(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
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
    </div>
  );
}
