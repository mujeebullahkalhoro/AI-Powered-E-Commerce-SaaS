import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/lib/api/client";
import { getProductById, getProducts } from "@/lib/api/products";
import { getProductReviews } from "@/lib/api/reviews";
import {
  formatPrice,
  getCategoryFromProduct,
} from "@/lib/products";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { AddToWishlistButton } from "@/components/products/AddToWishlistButton";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { RatingStars } from "@/components/products/RatingStars";
import { ReviewList } from "@/components/products/ReviewsSection";
import { ReviewSummarySection } from "@/components/products/ReviewSummarySection";
import { ReviewsPaginationLinks } from "@/components/products/ReviewsPaginationLinks";
import { Badge, stockStatusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewPage?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { product } = await getProductById(id);

    return {
      title: product.seoTitle || product.name,
      description: product.metaDescription || product.description,
    };
  } catch {
    return { title: "Product not found" };
  }
}

function stockLabel(stock: number): string {
  if (stock <= 0) {
    return "Out of stock";
  }

  if (stock < 10) {
    return `Low stock (${stock} left)`;
  }

  return "In stock";
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { id } = await params;
  const { reviewPage: reviewPageParam } = await searchParams;
  const reviewPage = Math.max(1, Number(reviewPageParam) || 1);

  let productData;

  try {
    productData = await getProductById(id);
  } catch (error) {
    // Only a genuine "product does not exist" (404) should render notFound().
    // Transient backend errors (timeout, connection reset, 500) must not be
    // masked as a permanent 404 — rethrow so Next shows a retryable error page.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const { product } = productData;
  const category = getCategoryFromProduct(product.category);

  const [reviewsData, relatedData] = await Promise.all([
    getProductReviews(id, { page: reviewPage, limit: 5 }),
    category
      ? getProducts({
          category: category.slug,
          limit: 4,
          sort: "rating",
        })
      : Promise.resolve({ products: [], total: 0, page: 1, pages: 0 }),
  ]);

  const relatedProducts = relatedData.products.filter(
    (item) => item.id !== product.id,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductImageGallery images={product.images} productName={product.name} />

        <div>
          {category ? (
            <Link
              href={`/products?category=${category.slug}`}
              className="text-sm font-medium text-violet-700 hover:underline"
            >
              {category.name}
            </Link>
          ) : null}

          <h1 className="mt-2 text-3xl font-bold text-zinc-900">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <RatingStars rating={product.averageRating} showValue />
            <span className="text-sm text-zinc-500">
              ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-zinc-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-lg text-zinc-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <Badge variant={stockStatusVariant(product.stock)}>
              {stockLabel(product.stock)}
            </Badge>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-zinc-600">
            {product.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock < 1}
            />
            <AddToWishlistButton productId={product.id} />
          </div>
        </div>
      </div>

      <div className="mt-16 space-y-10">
        <ReviewSummarySection productId={product.id} />

        <section id="reviews">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Customer reviews</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Average {product.averageRating.toFixed(1)} stars from{" "}
              {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
            </p>
          </div>

          <ReviewList reviews={reviewsData.reviews} />

          <Suspense
            fallback={
              <div className="mt-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            }
          >
            <ReviewsPaginationLinks
              productId={product.id}
              currentPage={reviewsData.page}
              totalPages={reviewsData.pages}
            />
          </Suspense>
        </section>

        {relatedProducts.length > 0 ? (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-zinc-900">
              Related products
            </h2>
            <ProductGrid className="lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </ProductGrid>
          </section>
        ) : null}
      </div>
    </div>
  );
}
