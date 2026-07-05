import { Suspense } from "react";
import { search } from "@/lib/api/search";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ query }: { query: string }) {
  const data = await search(query);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
          Results for: {data.query}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {data.count} result{data.count === 1 ? "" : "s"} found
        </p>
      </div>

      {data.products.length > 0 ? (
        <ProductGrid>
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductGrid>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <p className="text-sm text-zinc-600">
            No products found. Try different keywords.
          </p>
        </div>
      )}
    </>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-xl">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-zinc-200" />}>
          <SearchBar />
        </Suspense>
      </div>

      {!query ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Search our store</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter keywords above to find products with AI-powered semantic search.
          </p>
        </div>
      ) : (
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      )}
    </div>
  );
}
