import {
  AI_DISCLAIMER_TEXT,
  INJURY_ROUTING_CAVEAT,
} from "@/lib/disclaimer/constants";

interface AiDisclaimerProps {
  showInjuryCaveat?: boolean;
}

export default function AiDisclaimer({ showInjuryCaveat }: AiDisclaimerProps) {
  return (
    <div>
      <div className="h-px bg-primary/10 mt-4 mb-3" />
      <div className="flex items-start gap-2">
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-primary/40 leading-relaxed">
            {AI_DISCLAIMER_TEXT}
          </p>
          {showInjuryCaveat && (
            <p className="text-xs text-primary/40 leading-relaxed">
              {INJURY_ROUTING_CAVEAT}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
