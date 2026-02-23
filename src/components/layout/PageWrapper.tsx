import { cn } from "@/lib/utils/cn";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** If true, adds bottom padding to account for the fixed bottom nav */
  hasBottomNav?: boolean;
}

export default function PageWrapper({
  children,
  className,
  hasBottomNav = true,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-md",
        "min-h-screen bg-background",
        hasBottomNav && "pb-24",
        className
      )}
    >
      {children}
    </main>
  );
}
