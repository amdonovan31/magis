import { cn } from "@/lib/utils/cn";

interface TopBarProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export default function TopBar({
  title,
  subtitle,
  left,
  right,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between px-4",
        "border-b border-primary/10 bg-white",
        className
      )}
    >
      <div className="flex min-w-[40px] items-center">{left}</div>

      <div className="flex flex-col items-center">
        <h1 className="text-sm font-semibold text-primary">{title}</h1>
        {subtitle && (
          <p className="text-xs text-primary/50">{subtitle}</p>
        )}
      </div>

      <div className="flex min-w-[40px] items-center justify-end">{right}</div>
    </header>
  );
}
