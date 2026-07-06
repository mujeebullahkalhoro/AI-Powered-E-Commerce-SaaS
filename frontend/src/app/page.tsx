import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { getFeaturedProducts } from "@/lib/api/products";
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
    <div>
      {apiUnavailable ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Store data is temporarily unavailable. Make sure the backend is running on
          port 5000, then refresh this page.
        </div>
      ) : null}
      <section className="relative overflow-hidden bg-zinc-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.35),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-violet-300">
              AI-Powered Shopping
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find exactly what you need with intelligent search
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              Shop smarter with semantic product search, personalized recommendations,
              and an AI assistant that understands what you&apos;re looking for.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg">Browse products</Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="border-zinc-600 bg-transparent text-white hover:bg-white/10">
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">Shop by category</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Explore our collections
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesData.categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-700">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {category.description}
                  </p>
                ) : null}
                <span className="mt-4 inline-block text-sm font-medium text-zinc-900">
                  Shop now →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
