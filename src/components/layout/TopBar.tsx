import { cn } from "@/lib/utils/cn";

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export default function TopBar({
  title,
  showLogo,
  subtitle,
  left,
  right,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between px-5",
        "border-b border-primary/10 bg-background",
        className
      )}
    >
      <div className="flex min-w-[40px] items-center">{left}</div>

      <div className="flex flex-col items-center">
        {showLogo ? (
          <img src="/magis_logo_clean.svg" alt="Magis" style={{ height: 32 }} />
        ) : (
          <>
            {title && (
              <h1 className="font-heading text-base text-primary">{title}</h1>
            )}
            {subtitle && (
              <p className="font-body text-xs uppercase tracking-widest text-muted">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex min-w-[40px] items-center justify-end">{right}</div>
    </header>
  );
}
