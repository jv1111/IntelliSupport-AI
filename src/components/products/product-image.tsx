"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  onError?: () => void;
}

export function ProductImage({
  src,
  alt,
  sizes,
  className,
  onError,
}: ProductImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  if (!src?.trim() || failedImageUrl === src) {
    return <ProductImagePlaceholder />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => {
        setFailedImageUrl(src);
        onError?.();
      }}
    />
  );
}
