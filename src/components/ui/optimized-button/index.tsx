import { forwardRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?:
    | "default"
    | "sm"
    | "lg"
    | "xl"
    | "sm-icon"
    | "icon"
    | "lg-icon"
    | "xl-icon";
  loading?: boolean;
  asChild?: boolean;
}

export const OptimizedButton = forwardRef<
  HTMLButtonElement,
  OptimizedButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      children,
      onClick,
      disabled,
      asChild,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (loading || disabled || isProcessing) return;

        // Immediate visual feedback
        setIsPressed(true);
        setIsProcessing(true);

        // Use requestAnimationFrame for smooth interaction
        requestAnimationFrame(async () => {
          try {
            await onClick?.(e);
          } finally {
            // Reset states with proper timing
            setTimeout(() => {
              setIsPressed(false);
              setIsProcessing(false);
            }, 150);
          }
        });
      },
      [onClick, loading, disabled, isProcessing],
    );

    const isDisabled = disabled || loading || isProcessing;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant styles
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary":
              variant === "secondary",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring":
              variant === "outline",
            "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring":
              variant === "ghost",
          },
          // Size styles
          {
            "h-8 py-1.5 px-2.5": size === "default",
            "h-6 rounded-md py-1 px-2 text-xs": size === "sm",
            "h-10 rounded-lg py-2.5 px-3.5": size === "lg",
            "h-12 rounded-lg py-3 px-8 text-base": size === "xl",
            "h-7 w-7": size === "sm-icon",
            "h-8 w-8": size === "icon",
            "h-9 w-9": size === "lg-icon",
            "h-10 w-10": size === "xl-icon",
          },
          // Interactive states
          isPressed && "scale-95",
          className,
        )}
        disabled={isDisabled}
        onClick={asChild ? undefined : handleClick}
        {...props}
      >
        {loading || isProcessing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {!["sm-icon", "icon", "lg-icon", "xl-icon"].includes(size) && (
              <span>Loading...</span>
            )}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

OptimizedButton.displayName = "OptimizedButton";
