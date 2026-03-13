import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#2C4A2E]/10 text-[#2C4A2E]",
  success: "bg-green-100 text-green-800",
  warning: "bg-[#F5F3EE] border border-[#2C4A2E]/20 text-[#6B7B5E]",
  danger: "bg-red-100 text-red-800",
  accent: "bg-[#1B2E4B]/10 text-[#1B2E4B]",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
