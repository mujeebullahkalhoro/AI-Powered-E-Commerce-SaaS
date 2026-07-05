"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import type { Category } from "@/lib/api/types";
import type { ProductSort } from "@/lib/api/products";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = (searchParams.get("sort") as ProductSort) || "newest";
  const currentMin = searchParams.get("minPrice") ?? "";
  const currentMax = searchParams.get("maxPrice") ?? "";

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);

  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("page");
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  const handlePriceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(
      buildUrl({
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      }),
    );
  };

  const handleSortChange = (sort: ProductSort) => {
    router.push(buildUrl({ sort: sort === "newest" ? null : sort }));
  };

  return (
    <aside className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Categories
        </h2>
        <ul className="space-y-1">
          <li>
            <Link
              href={buildUrl({ category: null })}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                !currentCategory
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              All products
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={buildUrl({ category: category.slug })}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentCategory === category.slug
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Price range
        </h2>
        <form onSubmit={handlePriceSubmit} className="space-y-3">
          <Input
            label="Min price"
            type="number"
            min="0"
            step="0.01"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="0"
          />
          <Input
            label="Max price"
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Any"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full">
            Apply
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Sort by
        </h2>
        <select
          value={currentSort}
          onChange={(event) => handleSortChange(event.target.value as ProductSort)}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
