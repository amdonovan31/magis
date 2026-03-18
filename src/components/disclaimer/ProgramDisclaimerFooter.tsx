import {
  PROGRAM_FOOTER_COACHED,
  PROGRAM_FOOTER_AI_ONLY,
} from "@/lib/disclaimer/constants";

interface ProgramDisclaimerFooterProps {
  variant: "coached" | "ai-only";
}

export default function ProgramDisclaimerFooter({
  variant,
}: ProgramDisclaimerFooterProps) {
  const text =
    variant === "coached" ? PROGRAM_FOOTER_COACHED : PROGRAM_FOOTER_AI_ONLY;

  return (
    <div className="mt-6 pt-3 border-t border-primary/10">
      <div className="flex items-start justify-center gap-1.5">
        <svg
          className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary/25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="text-[11px] text-primary/30 leading-relaxed text-center">
          {text}
        </p>
      </div>
    </div>
  );
}
