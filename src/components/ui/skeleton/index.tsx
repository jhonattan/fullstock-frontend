import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  lines = 1,
  width = "100%",
  height = "1rem",
}: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={cn("animate-pulse bg-gray-200 rounded", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-gray-200 rounded",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
          )}
          style={{ height }}
        />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-separator overflow-hidden">
      {/* Image skeleton with proper aspect ratio */}
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-2">
        <Skeleton lines={2} height="0.875rem" />
        <Skeleton width="60%" height="1.25rem" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton width="128px" height="32px" />
        <div className="hidden md:flex space-x-8">
          <Skeleton width="60px" height="20px" />
          <Skeleton width="60px" height="20px" />
          <Skeleton width="60px" height="20px" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton width="40px" height="40px" className="rounded-full" />
          <Skeleton width="40px" height="40px" className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-7 p-6 border-b animate-pulse">
      <Skeleton width="80px" height="120px" className="rounded-xl" />
      <div className="flex-grow space-y-2">
        <Skeleton lines={2} height="0.875rem" />
        <Skeleton width="100px" height="1.25rem" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Skeleton width="32px" height="32px" className="rounded" />
            <Skeleton width="20px" height="1rem" />
            <Skeleton width="32px" height="32px" className="rounded" />
          </div>
          <Skeleton width="32px" height="32px" className="rounded" />
        </div>
      </div>
    </div>
  );
}
