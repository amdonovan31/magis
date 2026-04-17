"use client";

import { useState, useMemo } from "react";

interface BodyHeatMapProps {
  volumeByMuscle: Record<string, number>;
  unit: "kg" | "lbs";
  className?: string;
}

const PRIMARY = "#2C4A2E";
const ZERO_COLOR = "#D0CEC8";
const OUTLINE = "#C0BDB5";
const SKIN = "#E8E5DC";

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

type SvgHandlers = {
  fills: Record<string, string>;
  onHover: (muscle: string | null) => void;
  onTap: (muscle: string) => void;
};

function muscleProps(
  muscle: string,
  region: string,
  { fills, onHover, onTap }: SvgHandlers
) {
  return {
    "data-muscle": region,
    fill: fills[region] ?? ZERO_COLOR,
    stroke: SKIN,
    strokeWidth: 0.5,
    cursor: "pointer" as const,
    onMouseEnter: () => onHover(muscle),
    onMouseLeave: () => onHover(null),
    onClick: () => onTap(muscle),
  };
}

function FrontBody(handlers: SvgHandlers) {
  const m = (muscle: string, region: string) =>
    muscleProps(muscle, region, handlers);

  return (
    <svg viewBox="0 0 200 460" className="w-full max-w-[180px]">
      {/* Body outline */}
      <path
        d={`
          M100 8 C120 8 122 16 122 36 C122 50 116 58 112 64
          L112 72 C112 76 118 78 132 78
          C144 78 154 82 158 88
          C162 94 160 100 158 104
          L154 106 C152 108 150 108 148 108
          L142 170 C140 176 138 178 136 180
          L130 240
          C128 244 126 244 126 240
          L128 198 C128 196 126 194 124 196
          L118 248 C116 256 114 258 112 256
          L102 198
          L98 198
          L88 256 C86 258 84 256 82 248
          L76 196 C74 194 72 196 72 198
          L74 240 C74 244 72 244 70 240
          L64 180 C62 178 60 176 58 170
          L52 108 C50 108 48 108 46 106
          L42 104 C40 100 38 94 42 88
          C46 82 56 78 68 78
          C82 78 88 76 88 72
          L88 64 C84 58 78 50 78 36
          C78 16 80 8 100 8 Z
        `}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
      />

      {/* Head */}
      <ellipse cx="100" cy="36" rx="20" ry="26" fill={SKIN} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Neck */}
      <path
        d="M88 58 C88 56 92 62 100 62 C108 62 112 56 112 58 L112 72 C112 74 108 76 100 76 C92 76 88 74 88 72 Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={0.5}
      />

      {/* Front delts (shoulders) */}
      <path
        d={`M68 78 C64 78 56 80 50 86 C46 90 46 96 48 100
            L52 100 C54 96 56 92 60 88 C64 84 68 82 72 82 Z`}
        {...m("Shoulders", "front-delt-l")}
      />
      <path
        d={`M132 78 C136 78 144 80 150 86 C154 90 154 96 152 100
            L148 100 C146 96 144 92 140 88 C136 84 132 82 128 82 Z`}
        {...m("Shoulders", "front-delt-r")}
      />

      {/* Chest (pectorals) */}
      <path
        d={`M72 82 C76 80 88 78 100 78 C112 78 124 80 128 82
            L128 84 C128 98 124 108 118 114 C112 118 106 120 100 120
            C94 120 88 118 82 114 C76 108 72 98 72 84 Z`}
        {...m("Chest", "chest")}
      />

      {/* Core / Abs */}
      <path
        d={`M82 120 C88 118 94 120 100 120 C106 120 112 118 118 120
            L120 140 C120 156 118 172 116 188
            C112 194 106 196 100 196
            C94 196 88 194 84 188
            C82 172 80 156 80 140 Z`}
        {...m("Core", "abs")}
      />

      {/* Left bicep */}
      <path
        d={`M48 100 C46 104 44 110 42 120
            C40 134 38 148 38 158
            L52 158 C54 148 54 134 54 120
            C54 110 54 104 52 100 Z`}
        {...m("Biceps", "bicep-l")}
      />
      {/* Right bicep */}
      <path
        d={`M148 100 C146 104 146 110 146 120
            C146 134 146 148 148 158
            L162 158 C162 148 160 134 158 120
            C156 110 154 104 152 100 Z`}
        {...m("Biceps", "bicep-r")}
      />

      {/* Left forearm */}
      <path
        d={`M38 160 C36 172 34 188 34 200
            C34 212 34 224 36 234
            L48 234 C50 224 50 212 50 200
            C50 188 52 172 52 160 Z`}
        {...m("Forearms", "forearm-l")}
      />
      {/* Right forearm */}
      <path
        d={`M148 160 C148 172 150 188 150 200
            C150 212 150 224 152 234
            L164 234 C166 224 166 212 166 200
            C166 188 164 172 162 160 Z`}
        {...m("Forearms", "forearm-r")}
      />

      {/* Left quad */}
      <path
        d={`M84 196 C82 198 80 200 78 204
            C74 216 72 236 72 260
            C72 280 74 300 76 316
            C78 320 82 322 86 322
            C90 322 94 320 96 318
            L98 260 C98 236 98 216 96 204
            C96 200 94 198 92 196 Z`}
        {...m("Quads", "quad-l")}
      />
      {/* Right quad */}
      <path
        d={`M108 196 C106 198 104 200 104 204
            C102 216 102 236 102 260
            L104 318 C106 320 110 322 114 322
            C118 322 122 320 124 316
            C126 300 128 280 128 260
            C128 236 126 216 122 204
            C120 200 118 198 116 196 Z`}
        {...m("Quads", "quad-r")}
      />

      {/* Left calf (front) */}
      <path
        d={`M76 324 C78 326 82 328 86 328
            C90 328 94 326 96 324
            C96 340 94 356 92 370
            C90 382 88 392 86 400
            C84 400 82 398 80 392
            C78 382 76 370 76 356
            C76 344 76 336 76 324 Z`}
        {...m("Calves", "calf-l")}
      />
      {/* Right calf (front) */}
      <path
        d={`M104 324 C106 326 110 328 114 328
            C118 328 122 326 124 324
            C124 336 124 344 124 356
            C124 370 122 382 120 392
            C118 398 116 400 114 400
            C112 392 110 382 108 370
            C106 356 104 340 104 324 Z`}
        {...m("Calves", "calf-r")}
      />

      <text x="100" y="440" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">
        Front
      </text>
    </svg>
  );
}

function BackBody(handlers: SvgHandlers) {
  const m = (muscle: string, region: string) =>
    muscleProps(muscle, region, handlers);

  return (
    <svg viewBox="0 0 200 460" className="w-full max-w-[180px]">
      {/* Body outline */}
      <path
        d={`
          M100 8 C120 8 122 16 122 36 C122 50 116 58 112 64
          L112 72 C112 76 118 78 132 78
          C144 78 154 82 158 88
          C162 94 160 100 158 104
          L154 106 C152 108 150 108 148 108
          L142 170 C140 176 138 178 136 180
          L130 240
          C128 244 126 244 126 240
          L128 198 C128 196 126 194 124 196
          L118 248 C116 256 114 258 112 256
          L102 198
          L98 198
          L88 256 C86 258 84 256 82 248
          L76 196 C74 194 72 196 72 198
          L74 240 C74 244 72 244 70 240
          L64 180 C62 178 60 176 58 170
          L52 108 C50 108 48 108 46 106
          L42 104 C40 100 38 94 42 88
          C46 82 56 78 68 78
          C82 78 88 76 88 72
          L88 64 C84 58 78 50 78 36
          C78 16 80 8 100 8 Z
        `}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1}
      />

      {/* Head */}
      <ellipse cx="100" cy="36" rx="20" ry="26" fill={SKIN} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Neck */}
      <path
        d="M88 58 C88 56 92 62 100 62 C108 62 112 56 112 58 L112 72 C112 74 108 76 100 76 C92 76 88 74 88 72 Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={0.5}
      />

      {/* Traps (diamond/kite across upper back) */}
      <path
        d={`M80 76 L100 72 L120 76
            L124 82 C120 88 112 92 100 92
            C88 92 80 88 76 82 Z`}
        {...m("Traps", "traps")}
      />

      {/* Rear delts */}
      <path
        d={`M68 78 C64 78 56 80 50 86 C46 90 46 96 48 100
            L52 100 C54 96 56 92 60 88 C64 84 68 82 72 82 Z`}
        {...m("Shoulders", "rear-delt-l")}
      />
      <path
        d={`M132 78 C136 78 144 80 150 86 C154 90 154 96 152 100
            L148 100 C146 96 144 92 140 88 C136 84 132 82 128 82 Z`}
        {...m("Shoulders", "rear-delt-r")}
      />

      {/* Upper back */}
      <path
        d={`M76 84 C80 90 88 94 100 94 C112 94 120 90 124 84
            L128 84 C130 96 130 108 128 118
            L72 118 C70 108 70 96 72 84 Z`}
        {...m("Back", "upper-back")}
      />

      {/* Lats (V-taper) */}
      <path
        d={`M72 120 L128 120
            C126 136 124 152 120 164
            C116 174 108 178 100 178
            C92 178 84 174 80 164
            C76 152 74 136 72 120 Z`}
        {...m("Back", "lats")}
      />

      {/* Left tricep */}
      <path
        d={`M48 100 C46 104 44 110 42 120
            C40 134 38 148 38 158
            L52 158 C54 148 54 134 54 120
            C54 110 54 104 52 100 Z`}
        {...m("Triceps", "tricep-l")}
      />
      {/* Right tricep */}
      <path
        d={`M148 100 C146 104 146 110 146 120
            C146 134 146 148 148 158
            L162 158 C162 148 160 134 158 120
            C156 110 154 104 152 100 Z`}
        {...m("Triceps", "tricep-r")}
      />

      {/* Left forearm */}
      <path
        d={`M38 160 C36 172 34 188 34 200
            C34 212 34 224 36 234
            L48 234 C50 224 50 212 50 200
            C50 188 52 172 52 160 Z`}
        {...m("Forearms", "forearm-l")}
      />
      {/* Right forearm */}
      <path
        d={`M148 160 C148 172 150 188 150 200
            C150 212 150 224 152 234
            L164 234 C166 224 166 212 166 200
            C166 188 164 172 162 160 Z`}
        {...m("Forearms", "forearm-r")}
      />

      {/* Glutes */}
      <path
        d={`M80 180 C84 178 92 178 100 178
            C108 178 116 178 120 180
            L122 192 C122 200 118 208 114 212
            C110 214 106 216 100 216
            C94 216 90 214 86 212
            C82 208 78 200 78 192 Z`}
        {...m("Glutes", "glutes")}
      />

      {/* Left hamstring */}
      <path
        d={`M78 218 C80 216 86 214 92 214
            C94 214 96 214 98 216
            L96 260 C96 280 94 300 92 316
            C90 320 86 322 84 322
            C80 322 78 320 76 316
            C74 300 74 280 74 260
            C74 240 76 228 78 218 Z`}
        {...m("Hamstrings", "hamstring-l")}
      />
      {/* Right hamstring */}
      <path
        d={`M102 216 C104 214 106 214 108 214
            C114 214 120 216 122 218
            C124 228 126 240 126 260
            C126 280 126 300 124 316
            C122 320 120 322 116 322
            C114 322 110 320 108 316
            C106 300 104 280 104 260 Z`}
        {...m("Hamstrings", "hamstring-r")}
      />

      {/* Left calf */}
      <path
        d={`M76 324 C78 326 80 328 84 328
            C88 328 90 326 92 324
            C92 336 92 348 90 362
            C88 376 86 388 84 396
            C82 400 80 400 78 396
            C76 388 76 376 76 362
            C76 348 76 336 76 324 Z`}
        {...m("Calves", "calf-l")}
      />
      {/* Right calf */}
      <path
        d={`M108 324 C110 326 112 328 116 328
            C120 328 122 326 124 324
            C124 336 124 348 124 362
            C124 376 124 388 122 396
            C120 400 118 400 116 396
            C114 388 112 376 110 362
            C108 348 108 336 108 324 Z`}
        {...m("Calves", "calf-r")}
      />

      <text x="100" y="440" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">
        Back
      </text>
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
