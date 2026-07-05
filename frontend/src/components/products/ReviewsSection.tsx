import type { Review } from "@/lib/api/reviews";
import { RatingStars } from "./RatingStars";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No reviews yet. Be the first to review!</p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => {
        const userName =
          typeof review.user === "object" ? review.user.name : "Customer";

        return (
          <li
            key={review.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">{userName}</p>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              <time className="text-xs text-zinc-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
            {review.comment ? (
              <p className="text-sm leading-relaxed text-zinc-700">{review.comment}</p>
            ) : (
              <p className="text-sm italic text-zinc-400">No written comment.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
