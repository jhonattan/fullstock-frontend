import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Generate WebP variants if the source supports it
  const generateWebPSrc = (originalSrc: string) => {
    // If it's already WebP or from S3, try to generate WebP variant
    if (
      originalSrc.includes(".jpg") ||
      originalSrc.includes(".jpeg") ||
      originalSrc.includes(".png")
    ) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    }
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();

    // Fallback to original if WebP fails
    if (imageSrc.includes(".webp")) {
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  };

  useEffect(() => {
    // Try WebP first for better compression
    if (!src.includes(".webp") && !src.includes(".svg")) {
      const webpSrc = generateWebPSrc(src);
      if (webpSrc !== src) {
        setImageSrc(webpSrc);
      }
    }
  }, [src]);

  // Error state
  if (hasError && imageSrc === src) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
      >
        <span className="text-gray-400 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{
            width: width ? `${width}px` : "100%",
            height: height ? `${height}px` : "100%",
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      )}

      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } w-full h-full object-cover`}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
        sizes={sizes}
      />
    </div>
  );
}
