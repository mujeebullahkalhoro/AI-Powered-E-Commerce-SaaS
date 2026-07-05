"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ReviewsPaginationLinks({
  productId,
  currentPage,
  totalPages,
}: {
  productId: string;
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("reviewPage", String(page));
    return `/products/${productId}?${params.toString()}#reviews`;
  };

  return (
    <nav
      aria-label="Reviews pagination"
      className="mt-6 flex items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Previous
        </Link>
      ) : null}
      <span className="text-sm text-zinc-600">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
