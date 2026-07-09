"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardStats, getInventoryReport } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { DashboardStats, InventoryProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, stockStatusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, inventoryData] = await Promise.all([
        getDashboardStats(),
        getInventoryReport(),
      ]);
      setStats(dashboardData.stats);
      setLowStock(inventoryData.products);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const ordersChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return Object.entries(stats.ordersByStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      status,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Loading dashboard" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? "Dashboard unavailable"}
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Total orders" value={String(stats.totalOrders)} />
        <StatCard label="Total products" value={String(stats.totalProducts)} />
        <StatCard label="Total users" value={String(stats.totalUsers)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Orders by status</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {ordersChartData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#a1a1aa"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Revenue last 30 days
          </h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueLast30Days}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatPrice(Number(value))}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#18181b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">Low stock alert</h2>
          <Link
            href="/admin/inventory"
            className="text-sm font-medium text-zinc-900 hover:underline"
          >
            View inventory →
          </Link>
        </div>

        {lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">All products are well stocked.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {lowStock.slice(0, 8).map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium text-zinc-900">{product.name}</span>
                <Badge variant={stockStatusVariant(product.stock)}>
                  {product.stock} left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
