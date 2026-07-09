import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { ProductImage } from "@/components/products/ProductImage";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const data = await getCategories();
  const categories = data.categories.filter((category) => category.isActive);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse by category and jump straight to matching products.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <p className="text-sm text-zinc-500">No categories available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                {category.image?.url ? (
                  <ProductImage
                    src={category.image.url}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-700">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                    {category.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-400">
                    View products in this category
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
