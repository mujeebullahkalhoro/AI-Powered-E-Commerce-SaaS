import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { getFeaturedProducts } from "@/lib/api/products";
import { AdminHomeRedirect } from "@/components/layout/AdminHomeRedirect";
import { CategoryCarousel } from "@/components/products/CategoryCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let apiUnavailable = false;

  const [featuredData, categoriesData] = await Promise.all([
    getFeaturedProducts().catch(() => {
      apiUnavailable = true;
      return { success: true as const, count: 0, products: [] };
    }),
    getCategories().catch(() => {
      apiUnavailable = true;
      return { success: true as const, count: 0, categories: [] };
    }),
  ]);

  return (
    <AdminHomeRedirect>
    <div>
      {apiUnavailable ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Store data is temporarily unavailable. Make sure the backend is running on
          port 5000, then refresh this page.
        </div>
      ) : null}
      <section className="relative overflow-hidden bg-zinc-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.35),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-violet-300 sm:mb-4 sm:text-sm">
              AI-Powered Shopping
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Find exactly what you need with intelligent search
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:mt-6 sm:text-lg">
              Shop smarter with semantic product search, personalized recommendations,
              and an AI assistant that understands what you&apos;re looking for.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">Browse products</Button>
              </Link>
              <Link href="/search" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-zinc-600 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                  Try AI search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Featured products</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Top-rated picks curated for you
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-900 hover:underline"
          >
            View all
          </Link>
        </div>

        {featuredData.products.length > 0 ? (
          <ProductGrid>
            {featuredData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        ) : (
          <p className="text-sm text-zinc-500">No featured products available.</p>
        )}
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Shop by category</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Explore our collections
              </p>
            </div>
            <Link
              href="/categories"
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              View all
            </Link>
          </div>

          <CategoryCarousel
            categories={categoriesData.categories.filter(
              (category) => category.isActive,
            )}
          />
        </div>
      </section>
    </div>
    </AdminHomeRedirect>
  );
}
