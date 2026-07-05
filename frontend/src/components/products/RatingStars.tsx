export interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

export function RatingStars({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  className = "",
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(max, rating));

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`${clamped.toFixed(1)} out of ${max} stars`}
    >
      <div className="flex items-center">
        {Array.from({ length: max }, (_, index) => {
          const fill = Math.max(0, Math.min(1, clamped - index));

          return (
            <span key={index} className="relative inline-block">
              <StarIcon className={`${sizeClasses[size]} text-zinc-300`} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon
                  className={`${sizeClasses[size]} text-amber-400`}
                  filled
                />
              </span>
            </span>
          );
        })}
      </div>
      {showValue ? (
        <span className="text-sm text-zinc-600">{clamped.toFixed(1)}</span>
      ) : null}
    </div>
  );
}

function StarIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10 2.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 15.9l-4.94 2.8.94-5.5-4-3.9 5.53-.8L10 2.5z" />
    </svg>
  );
}
