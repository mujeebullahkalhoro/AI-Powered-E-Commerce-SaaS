import Image from "next/image";

export function isLocalProductImage(url: string): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost):5000\/uploads\//.test(url);
}

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  className = "",
  sizes,
  fill = false,
  priority = false,
}: ProductImageProps) {
  const unoptimized = isLocalProductImage(src);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}
