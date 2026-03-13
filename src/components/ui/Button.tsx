import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#1B2E4B] text-[#FAF9F6] hover:opacity-90 active:opacity-80",
  accent:
    "bg-[#1B2E4B] text-[#FAF9F6] hover:opacity-90 active:opacity-80",
  secondary:
    "bg-transparent border border-[#2C4A2E] text-[#2C4A2E] hover:bg-[#F5F3EE] active:bg-[#F5F3EE]",
  ghost:
    "bg-transparent text-[#6B7B5E] hover:text-[#2C4A2E] active:text-[#2C4A2E]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-12 px-8 text-xs",
  lg: "h-14 px-10 text-xs",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-body font-medium uppercase tracking-widest",
          "transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#2C4A2E]/50 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
