"use client";

import { useEffect, useState } from "react";
import { getReviewSummary } from "@/lib/api/ai";
import { Spinner } from "@/components/ui/Spinner";

export function ReviewSummarySection({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReviewSummary(productId)
      .then((data) => {
        if (!cancelled) {
          setSummary(data.summary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load AI review summary.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">AI Review Summary</h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
          AI
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner size="sm" label="Loading summary" />
          Generating summary...
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error && summary ? (
        <p className="text-sm leading-relaxed text-zinc-700">{summary}</p>
      ) : null}
    </section>
  );
}
