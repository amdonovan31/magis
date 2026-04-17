"use client";

import { useState, useMemo } from "react";

interface BodyHeatMapProps {
  volumeByMuscle: Record<string, number>;
  unit: "kg" | "lbs";
  className?: string;
}

const PRIMARY = "#2C4A2E";
const ZERO_COLOR = "#D0CEC8";

function getIntensity(
  value: number,
  values: number[]
): "zero" | "low" | "mid" | "high" {
  if (value === 0) return "zero";
  const nonZero = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (nonZero.length <= 1) return "high";
  const idx = nonZero.indexOf(value);
  const pct = idx / (nonZero.length - 1);
  if (pct < 0.25) return "low";
  if (pct < 0.75) return "mid";
  return "high";
}

function intensityToFill(intensity: "zero" | "low" | "mid" | "high"): string {
  switch (intensity) {
    case "zero":
      return ZERO_COLOR;
    case "low":
      return `${PRIMARY}33`;
    case "mid":
      return `${PRIMARY}80`;
    case "high":
      return `${PRIMARY}E6`;
  }
}

const MUSCLE_TO_REGIONS: Record<string, string[]> = {
  Chest: ["chest"],
  Shoulders: ["front-delt-l", "front-delt-r", "rear-delt-l", "rear-delt-r"],
  Biceps: ["bicep-l", "bicep-r"],
  Triceps: ["tricep-l", "tricep-r"],
  Core: ["abs"],
  Quads: ["quad-l", "quad-r"],
  Back: ["upper-back", "lats"],
  Traps: ["traps"],
  Glutes: ["glutes"],
  Hamstrings: ["hamstring-l", "hamstring-r"],
  Calves: ["calf-l", "calf-r"],
  Forearms: ["forearm-l", "forearm-r"],
};

function distributeLegs(volumeByMuscle: Record<string, number>): Record<string, number> {
  const result = { ...volumeByMuscle };
  const legsVol = result["Legs"] ?? 0;
  if (legsVol > 0) {
    const share = legsVol / 4;
    for (const g of ["Quads", "Hamstrings", "Glutes", "Calves"]) {
      result[g] = (result[g] ?? 0) + share;
    }
    delete result["Legs"];
  }
  return result;
}

function FrontBody({ fills, onHover, onTap }: {
  fills: Record<string, string>;
  onHover: (muscle: string | null) => void;
  onTap: (muscle: string) => void;
}) {
  const common = (muscle: string, regions: string[]) => ({
    fill: fills[regions[0]] ?? ZERO_COLOR,
    stroke: "#EEECE6",
    strokeWidth: 1,
    cursor: "pointer" as const,
    onMouseEnter: () => onHover(muscle),
    onMouseLeave: () => onHover(null),
    onClick: () => onTap(muscle),
  });

  return (
    <svg viewBox="0 0 200 420" className="w-full max-w-[180px]">
      {/* Head */}
      <ellipse cx="100" cy="32" rx="22" ry="28" fill="#E8E5DC" stroke="#C5C2BA" strokeWidth="1" />

      {/* Neck */}
      <rect x="90" y="58" width="20" height="14" rx="4" fill="#E8E5DC" stroke="#C5C2BA" strokeWidth="1" />

      {/* Traps (front visible) */}
      <path d="M70 72 L90 72 L90 80 L70 85 Z" {...common("Traps", ["traps"])} />
      <path d="M110 72 L130 72 L130 85 L110 80 Z" {...common("Traps", ["traps"])} />

      {/* Shoulders / Front delts */}
      <ellipse cx="58" cy="90" rx="16" ry="12" {...common("Shoulders", ["front-delt-l"])} />
      <ellipse cx="142" cy="90" rx="16" ry="12" {...common("Shoulders", ["front-delt-r"])} />

      {/* Chest */}
      <path d="M70 80 L130 80 L135 105 L125 115 L100 118 L75 115 L65 105 Z" {...common("Chest", ["chest"])} />

      {/* Abs / Core */}
      <path d="M78 118 L122 118 L120 195 L80 195 Z" rx="4" {...common("Core", ["abs"])} />

      {/* Biceps */}
      <path d="M42 98 L56 92 L58 140 L42 140 Z" {...common("Biceps", ["bicep-l"])} />
      <path d="M144 92 L158 98 L158 140 L142 140 Z" {...common("Biceps", ["bicep-r"])} />

      {/* Forearms */}
      <path d="M38 142 L56 142 L52 200 L40 200 Z" {...common("Forearms", ["forearm-l"])} />
      <path d="M144 142 L162 142 L160 200 L148 200 Z" {...common("Forearms", ["forearm-r"])} />

      {/* Quads */}
      <path d="M78 198 L100 198 L96 310 L72 310 Z" {...common("Quads", ["quad-l"])} />
      <path d="M100 198 L122 198 L128 310 L104 310 Z" {...common("Quads", ["quad-r"])} />

      {/* Calves (front) */}
      <path d="M74 315 L98 315 L94 390 L78 390 Z" {...common("Calves", ["calf-l"])} />
      <path d="M102 315 L126 315 L122 390 L106 390 Z" {...common("Calves", ["calf-r"])} />

      {/* Label */}
      <text x="100" y="415" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">Front</text>
    </svg>
  );
}

function BackBody({ fills, onHover, onTap }: {
  fills: Record<string, string>;
  onHover: (muscle: string | null) => void;
  onTap: (muscle: string) => void;
}) {
  const common = (muscle: string, regions: string[]) => ({
    fill: fills[regions[0]] ?? ZERO_COLOR,
    stroke: "#EEECE6",
    strokeWidth: 1,
    cursor: "pointer" as const,
    onMouseEnter: () => onHover(muscle),
    onMouseLeave: () => onHover(null),
    onClick: () => onTap(muscle),
  });

  return (
    <svg viewBox="0 0 200 420" className="w-full max-w-[180px]">
      {/* Head */}
      <ellipse cx="100" cy="32" rx="22" ry="28" fill="#E8E5DC" stroke="#C5C2BA" strokeWidth="1" />

      {/* Neck */}
      <rect x="90" y="58" width="20" height="14" rx="4" fill="#E8E5DC" stroke="#C5C2BA" strokeWidth="1" />

      {/* Traps */}
      <path d="M70 72 L90 72 L90 85 L70 90 Z" {...common("Traps", ["traps"])} />
      <path d="M110 72 L130 72 L130 90 L110 85 Z" {...common("Traps", ["traps"])} />

      {/* Rear delts */}
      <ellipse cx="58" cy="90" rx="16" ry="12" {...common("Shoulders", ["rear-delt-l"])} />
      <ellipse cx="142" cy="90" rx="16" ry="12" {...common("Shoulders", ["rear-delt-r"])} />

      {/* Upper back + Lats */}
      <path d="M70 80 L130 80 L135 120 L65 120 Z" {...common("Back", ["upper-back"])} />
      <path d="M68 122 L132 122 L126 180 L74 180 Z" {...common("Back", ["lats"])} />

      {/* Triceps */}
      <path d="M42 98 L56 92 L58 140 L42 140 Z" {...common("Triceps", ["tricep-l"])} />
      <path d="M144 92 L158 98 L158 140 L142 140 Z" {...common("Triceps", ["tricep-r"])} />

      {/* Forearms */}
      <path d="M38 142 L56 142 L52 200 L40 200 Z" {...common("Forearms", ["forearm-l"])} />
      <path d="M144 142 L162 142 L160 200 L148 200 Z" {...common("Forearms", ["forearm-r"])} />

      {/* Glutes */}
      <path d="M74 182 L126 182 L128 220 L72 220 Z" {...common("Glutes", ["glutes"])} />

      {/* Hamstrings */}
      <path d="M72 224 L100 224 L96 315 L72 315 Z" {...common("Hamstrings", ["hamstring-l"])} />
      <path d="M100 224 L128 224 L128 315 L104 315 Z" {...common("Hamstrings", ["hamstring-r"])} />

      {/* Calves */}
      <path d="M74 318 L98 318 L94 390 L78 390 Z" {...common("Calves", ["calf-l"])} />
      <path d="M102 318 L126 318 L122 390 L106 390 Z" {...common("Calves", ["calf-r"])} />

      {/* Label */}
      <text x="100" y="415" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">Back</text>
    </svg>
  );
}

export default function BodyHeatMap({
  volumeByMuscle,
  unit,
  className,
}: BodyHeatMapProps) {
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);

  const adjusted = useMemo(() => distributeLegs(volumeByMuscle), [volumeByMuscle]);

  const allValues = useMemo(
    () => Object.values(adjusted).filter((v) => v > 0),
    [adjusted]
  );

  const fills = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [muscle, regions] of Object.entries(MUSCLE_TO_REGIONS)) {
      const vol = adjusted[muscle] ?? 0;
      const intensity = getIntensity(vol, allValues);
      const fill = intensityToFill(intensity);
      for (const region of regions) {
        result[region] = fill;
      }
    }
    return result;
  }, [adjusted, allValues]);

  const totalVolume = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const activeVolume = activeMuscle ? (adjusted[activeMuscle] ?? 0) : 0;
  const activePct = totalVolume > 0 ? Math.round((activeVolume / totalVolume) * 100) : 0;

  function handleTap(muscle: string) {
    setActiveMuscle((prev) => (prev === muscle ? null : muscle));
  }

  return (
    <div className={className}>
      <div className="flex items-start justify-center gap-2">
        <FrontBody
          fills={fills}
          onHover={setActiveMuscle}
          onTap={handleTap}
        />
        <BackBody
          fills={fills}
          onHover={setActiveMuscle}
          onTap={handleTap}
        />
      </div>

      {/* Tooltip */}
      {activeMuscle && (
        <div className="mt-2 text-center">
          <p className="text-sm font-semibold text-primary">{activeMuscle}</p>
          <p className="text-xs text-primary/60">
            {activeVolume.toLocaleString()} {unit}
            {totalVolume > 0 && (
              <span className="text-primary/40 ml-1">({activePct}% of total)</span>
            )}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-[10px] text-primary/40">None</span>
        <div
          className="h-2 w-24 rounded-full"
          style={{
            background: `linear-gradient(to right, ${ZERO_COLOR}, ${PRIMARY}33, ${PRIMARY}80, ${PRIMARY}E6)`,
          }}
        />
        <span className="text-[10px] text-primary/40">High</span>
      </div>
    </div>
  );
}
