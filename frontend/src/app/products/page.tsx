import { Suspense } from "react";
import { getCategories } from "@/lib/api/categories";
import { getProducts, type ProductSort } from "@/lib/api/products";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { Spinner } from "@/components/ui/Spinner";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

function parseNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const minPrice = parseNumber(params.minPrice);
  const maxPrice = parseNumber(params.maxPrice);
  const sort = (params.sort as ProductSort) || "newest";

  const [productsData, categoriesData] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      category,
      minPrice,
      maxPrice,
      sort,
    }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Products</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {productsData.total} product{productsData.total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Spinner label="Loading filters" />
            </div>
          }
        >
          <ProductFilters categories={categoriesData.categories} />
        </Suspense>

        <div>
          {productsData.products.length > 0 ? (
            <ProductGrid>
              {productsData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
              <p className="text-sm text-zinc-500">No products match your filters.</p>
            </div>
          )}

          <Suspense fallback={null}>
            <ProductsPagination
              currentPage={productsData.page}
              totalPages={productsData.pages}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
