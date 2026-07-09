"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/api/types";
import { ProductImage } from "./ProductImage";

export interface CategoryCarouselProps {
  categories: Category[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, categories.length]);

  const scrollByCards = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const amount = Math.max(el.clientWidth * 0.8, 280);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (categories.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No categories available.</p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="group flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md sm:w-72"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
              {category.image?.url ? (
                <ProductImage
                  src={category.image.url}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 80vw, 288px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
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
            </div>
          </Link>
        ))}
      </div>

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByCards("left")}
          aria-label="Scroll categories left"
          className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md transition hover:bg-zinc-50 md:flex"
        >
          <ChevronIcon direction="left" />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByCards("right")}
          aria-label="Scroll categories right"
          className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md transition hover:bg-zinc-50 md:flex"
        >
          <ChevronIcon direction="right" />
        </button>
      ) : null}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      />
    </svg>
  );
}
