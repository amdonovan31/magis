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
    <svg viewBox="0 0 200 480" className="w-full max-w-[180px]">
      {/* Body outline silhouette */}
      <path
        d={`
          M100 6 C115 6 118 14 118 30 C118 44 114 52 110 58
          C108 62 108 66 110 68 C114 70 122 72 132 74
          C140 76 148 78 154 82 C160 86 162 92 160 98
          C158 104 154 112 150 124 C146 136 142 152 140 168
          C138 178 136 184 134 188 C132 192 130 194 128 196
          C126 200 124 204 124 210 C124 216 126 224 128 232
          C130 238 130 240 128 240
          C126 240 124 238 124 234
          C122 226 118 218 116 210
          C114 204 112 200 110 196
          C108 192 106 190 104 188 C102 186 102 184 102 182
          C102 178 98 178 98 182
          C98 184 98 186 96 188
          C94 190 92 192 90 196
          C88 200 86 204 84 210
          C82 218 78 226 76 234
          C76 238 74 240 72 240
          C70 240 70 238 72 232
          C74 224 76 216 76 210
          C76 204 74 200 72 196
          C70 194 68 192 66 188 C64 184 62 178 60 168
          C58 152 54 136 50 124 C46 112 42 104 40 98
          C38 92 40 86 46 82 C52 78 60 76 68 74
          C78 72 86 70 90 68 C92 66 92 62 90 58
          C86 52 82 44 82 30 C82 14 85 6 100 6 Z
        `}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1.2}
      />

      {/* Head */}
      <ellipse cx="100" cy="30" rx="17" ry="22" fill={SKIN} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Neck */}
      <path
        d="M90 50 C92 54 96 56 100 56 C104 56 108 54 110 50 C110 54 110 62 110 68 C108 70 104 70 100 70 C96 70 92 70 90 68 C90 62 90 54 90 50 Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={0.5}
      />

      {/* Left front delt */}
      <path
        d={`M68 74 C60 76 52 78 46 82
            C42 86 40 90 40 96
            C42 96 46 94 50 90
            C54 86 58 84 62 82
            C64 80 66 78 68 76 Z`}
        {...m("Shoulders", "front-delt-l")}
      />
      {/* Right front delt */}
      <path
        d={`M132 74 C140 76 148 78 154 82
            C158 86 160 90 160 96
            C158 96 154 94 150 90
            C146 86 142 84 138 82
            C136 80 134 78 132 76 Z`}
        {...m("Shoulders", "front-delt-r")}
      />

      {/* Chest — two pecs with center dip */}
      <path
        d={`M68 76 C72 74 80 72 90 70 C94 70 97 70 100 72
            C100 78 98 88 96 96 C94 102 90 108 86 112
            C82 116 76 118 72 118
            C68 116 64 110 62 104
            C60 98 60 90 62 84 C64 80 66 78 68 76 Z
            M132 76 C128 74 120 72 110 70 C106 70 103 70 100 72
            C100 78 102 88 104 96 C106 102 110 108 114 112
            C118 116 124 118 128 118
            C132 116 136 110 138 104
            C140 98 140 90 138 84 C136 80 134 78 132 76 Z`}
        {...m("Chest", "chest")}
      />

      {/* Core / Abs — tapered at waist */}
      <path
        d={`M72 120 C76 118 84 118 92 118 C96 118 98 118 100 120
            C102 118 104 118 108 118 C116 118 124 118 128 120
            C128 128 126 140 124 152
            C122 162 120 170 118 178
            C116 184 112 188 108 190
            C104 192 102 192 100 192
            C98 192 96 192 92 190
            C88 188 84 184 82 178
            C80 170 78 162 76 152
            C74 140 72 128 72 120 Z`}
        {...m("Core", "abs")}
      />

      {/* Left bicep — muscle belly shape */}
      <path
        d={`M40 98 C38 104 36 114 36 126
            C36 138 38 150 40 160
            C42 166 44 168 46 168
            C48 168 50 166 52 162
            C54 154 56 142 56 130
            C56 118 54 108 52 100
            C50 96 46 96 42 96 Z`}
        {...m("Biceps", "bicep-l")}
      />
      {/* Right bicep */}
      <path
        d={`M160 98 C162 104 164 114 164 126
            C164 138 162 150 160 160
            C158 166 156 168 154 168
            C152 168 150 166 148 162
            C146 154 144 142 144 130
            C144 118 146 108 148 100
            C150 96 154 96 158 96 Z`}
        {...m("Biceps", "bicep-r")}
      />

      {/* Left forearm — brachioradialis bulge tapering to wrist */}
      <path
        d={`M40 170 C38 178 36 190 34 204
            C32 218 32 228 34 236
            C36 240 38 240 40 238
            C44 232 46 224 48 214
            C50 204 52 192 52 180
            C52 174 50 170 48 170 Z`}
        {...m("Forearms", "forearm-l")}
      />
      {/* Right forearm */}
      <path
        d={`M160 170 C162 178 164 190 166 204
            C168 218 168 228 166 236
            C164 240 162 240 160 238
            C156 232 154 224 152 214
            C150 204 148 192 148 180
            C148 174 150 170 152 170 Z`}
        {...m("Forearms", "forearm-r")}
      />

      {/* Left quad — vastus lateralis sweep */}
      <path
        d={`M82 192 C78 196 74 204 72 216
            C70 232 68 252 68 272
            C68 288 70 304 72 316
            C74 322 78 326 82 328
            C86 330 90 330 94 328
            C96 326 98 322 98 318
            C98 304 98 288 98 272
            C98 252 96 232 96 216
            C94 204 92 198 90 194
            C88 192 86 192 84 192 Z`}
        {...m("Quads", "quad-l")}
      />
      {/* Right quad */}
      <path
        d={`M118 192 C122 196 126 204 128 216
            C130 232 132 252 132 272
            C132 288 130 304 128 316
            C126 322 122 326 118 328
            C114 330 110 330 106 328
            C104 326 102 322 102 318
            C102 304 102 288 102 272
            C102 252 104 232 104 216
            C106 204 108 198 110 194
            C112 192 114 192 116 192 Z`}
        {...m("Quads", "quad-r")}
      />

      {/* Left calf (front view) */}
      <path
        d={`M72 332 C76 330 80 330 84 330
            C88 330 92 330 96 332
            C96 342 94 354 92 366
            C90 378 88 390 86 400
            C84 408 82 410 80 408
            C78 402 76 394 74 384
            C72 372 72 358 72 344 Z`}
        {...m("Calves", "calf-l")}
      />
      {/* Right calf (front view) */}
      <path
        d={`M104 332 C108 330 112 330 116 330
            C120 330 124 330 128 332
            C128 344 128 358 126 372
            C124 384 122 394 120 402
            C118 408 116 410 114 408
            C112 400 110 390 108 378
            C106 366 104 354 104 344 Z`}
        {...m("Calves", "calf-r")}
      />

      <text x="100" y="460" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">
        Front
      </text>
    </svg>
  );
}

function BackBody(handlers: SvgHandlers) {
  const m = (muscle: string, region: string) =>
    muscleProps(muscle, region, handlers);

  return (
    <svg viewBox="0 0 200 480" className="w-full max-w-[180px]">
      {/* Body outline silhouette — same as front */}
      <path
        d={`
          M100 6 C115 6 118 14 118 30 C118 44 114 52 110 58
          C108 62 108 66 110 68 C114 70 122 72 132 74
          C140 76 148 78 154 82 C160 86 162 92 160 98
          C158 104 154 112 150 124 C146 136 142 152 140 168
          C138 178 136 184 134 188 C132 192 130 194 128 196
          C126 200 124 204 124 210 C124 216 126 224 128 232
          C130 238 130 240 128 240
          C126 240 124 238 124 234
          C122 226 118 218 116 210
          C114 204 112 200 110 196
          C108 192 106 190 104 188 C102 186 102 184 102 182
          C102 178 98 178 98 182
          C98 184 98 186 96 188
          C94 190 92 192 90 196
          C88 200 86 204 84 210
          C82 218 78 226 76 234
          C76 238 74 240 72 240
          C70 240 70 238 72 232
          C74 224 76 216 76 210
          C76 204 74 200 72 196
          C70 194 68 192 66 188 C64 184 62 178 60 168
          C58 152 54 136 50 124 C46 112 42 104 40 98
          C38 92 40 86 46 82 C52 78 60 76 68 74
          C78 72 86 70 90 68 C92 66 92 62 90 58
          C86 52 82 44 82 30 C82 14 85 6 100 6 Z
        `}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1.2}
      />

      {/* Head */}
      <ellipse cx="100" cy="30" rx="17" ry="22" fill={SKIN} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Neck */}
      <path
        d="M90 50 C92 54 96 56 100 56 C104 56 108 54 110 50 C110 54 110 62 110 68 C108 70 104 70 100 70 C96 70 92 70 90 68 C90 62 90 54 90 50 Z"
        fill={SKIN}
        stroke={OUTLINE}
        strokeWidth={0.5}
      />

      {/* Traps — diamond/kite from neck to mid-back */}
      <path
        d={`M90 68 C94 66 96 64 100 64 C104 64 106 66 110 68
            C116 72 126 74 134 78
            C130 84 124 90 118 96
            C112 100 106 102 100 102
            C94 102 88 100 82 96
            C76 90 70 84 66 78
            C74 74 84 72 90 68 Z`}
        {...m("Traps", "traps")}
      />

      {/* Left rear delt */}
      <path
        d={`M66 76 C60 76 52 78 46 82
            C42 86 40 90 40 96
            C42 96 46 94 50 90
            C54 86 58 84 62 82
            C64 80 66 78 66 76 Z`}
        {...m("Shoulders", "rear-delt-l")}
      />
      {/* Right rear delt */}
      <path
        d={`M134 76 C140 76 148 78 154 82
            C158 86 160 90 160 96
            C158 96 154 94 150 90
            C146 86 142 84 138 82
            C136 80 134 78 134 76 Z`}
        {...m("Shoulders", "rear-delt-r")}
      />

      {/* Upper back / rhomboids — between traps and lats */}
      <path
        d={`M82 98 C88 102 94 104 100 104
            C106 104 112 102 118 98
            C122 96 126 94 130 92
            C132 100 132 110 130 120
            C128 122 120 124 112 124
            C106 124 100 124 100 124
            C100 124 94 124 88 124
            C80 124 72 122 70 120
            C68 110 68 100 70 92
            C74 94 78 96 82 98 Z`}
        {...m("Back", "upper-back")}
      />

      {/* Lats — V-taper, wide at armpits, narrow at lower back */}
      <path
        d={`M70 122 C72 124 80 126 88 126
            C94 126 100 126 100 126
            C100 126 106 126 112 126
            C120 126 128 124 130 122
            C132 130 132 142 130 154
            C128 164 124 172 118 178
            C114 182 108 184 100 184
            C92 184 86 182 82 178
            C76 172 72 164 70 154
            C68 142 68 130 70 122 Z`}
        {...m("Back", "lats")}
      />

      {/* Left tricep — horseshoe shape */}
      <path
        d={`M40 98 C38 104 36 114 36 126
            C36 138 38 150 40 160
            C42 166 44 168 46 168
            C48 168 50 166 52 162
            C54 154 56 142 56 130
            C56 118 54 108 52 100
            C50 96 46 96 42 96 Z`}
        {...m("Triceps", "tricep-l")}
      />
      {/* Right tricep */}
      <path
        d={`M160 98 C162 104 164 114 164 126
            C164 138 162 150 160 160
            C158 166 156 168 154 168
            C152 168 150 166 148 162
            C146 154 144 142 144 130
            C144 118 146 108 148 100
            C150 96 154 96 158 96 Z`}
        {...m("Triceps", "tricep-r")}
      />

      {/* Left forearm */}
      <path
        d={`M40 170 C38 178 36 190 34 204
            C32 218 32 228 34 236
            C36 240 38 240 40 238
            C44 232 46 224 48 214
            C50 204 52 192 52 180
            C52 174 50 170 48 170 Z`}
        {...m("Forearms", "forearm-l")}
      />
      {/* Right forearm */}
      <path
        d={`M160 170 C162 178 164 190 166 204
            C168 218 168 228 166 236
            C164 240 162 240 160 238
            C156 232 154 224 152 214
            C150 204 148 192 148 180
            C148 174 150 170 152 170 Z`}
        {...m("Forearms", "forearm-r")}
      />

      {/* Glutes — two rounded shapes */}
      <path
        d={`M82 186 C86 184 92 184 96 184
            C98 184 100 186 100 188
            C100 186 102 184 104 184
            C108 184 114 184 118 186
            C122 190 124 198 124 206
            C124 214 120 220 116 224
            C112 228 106 228 100 228
            C94 228 88 228 84 224
            C80 220 76 214 76 206
            C76 198 78 190 82 186 Z`}
        {...m("Glutes", "glutes")}
      />

      {/* Left hamstring — biceps femoris shape */}
      <path
        d={`M76 228 C80 226 86 226 92 226
            C96 226 98 228 98 230
            C98 246 96 266 94 286
            C92 302 90 314 88 324
            C86 330 82 332 80 332
            C76 332 72 328 70 322
            C68 312 68 298 68 282
            C68 262 70 244 74 232 Z`}
        {...m("Hamstrings", "hamstring-l")}
      />
      {/* Right hamstring */}
      <path
        d={`M124 228 C120 226 114 226 108 226
            C104 226 102 228 102 230
            C102 246 104 266 106 286
            C108 302 110 314 112 324
            C114 330 118 332 120 332
            C124 332 128 328 130 322
            C132 312 132 298 132 282
            C132 262 130 244 126 232 Z`}
        {...m("Hamstrings", "hamstring-r")}
      />

      {/* Left calf — gastrocnemius diamond bulge */}
      <path
        d={`M70 334 C74 332 78 332 82 332
            C86 332 88 334 90 336
            C92 344 92 354 90 368
            C88 380 86 392 84 402
            C82 410 80 412 78 410
            C76 404 74 394 72 382
            C70 368 68 354 68 342 Z`}
        {...m("Calves", "calf-l")}
      />
      {/* Right calf */}
      <path
        d={`M130 334 C126 332 122 332 118 332
            C114 332 112 334 110 336
            C108 344 108 354 110 368
            C112 380 114 392 116 402
            C118 410 120 412 122 410
            C124 404 126 394 128 382
            C130 368 132 354 132 342 Z`}
        {...m("Calves", "calf-r")}
      />

      <text x="100" y="460" textAnchor="middle" className="text-[11px] fill-primary/40 font-medium">
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
