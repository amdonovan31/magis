import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm">
        <p className="text-6xl font-bold text-primary/10 mb-2">404</p>
        <h2 className="text-xl font-bold text-primary mb-2">Page not found</h2>
        <p className="text-sm text-primary/60 mb-6">
          This page doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/">
          <Button fullWidth>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
