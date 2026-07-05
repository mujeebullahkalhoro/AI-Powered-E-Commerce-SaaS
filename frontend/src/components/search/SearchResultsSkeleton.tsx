import { ProductGrid } from "@/components/products/ProductGrid";

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="aspect-square animate-pulse bg-zinc-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-full animate-pulse rounded-lg bg-zinc-200" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-2/3 max-w-lg animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
      </div>
      <ProductGrid>
        {Array.from({ length: 8 }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </ProductGrid>
    </div>
  );
}
