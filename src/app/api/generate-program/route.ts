import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

interface GeneratedExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  alternate_exercise_ids?: string[];
}

interface GeneratedWorkout {
  day_of_week: string;
  workout_name: string;
  muscle_groups: string[];
  exercises: GeneratedExercise[];
}

interface GeneratedWeek {
  week_number: number;
  workouts: GeneratedWorkout[];
}

interface GeneratedProgram {
  program_name: string;
  program_description: string;
  weeks: GeneratedWeek[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured. Missing ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.app_metadata?.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Parse request body
  let clientId: string;
  let guidelinesId: string;
  let regenerationFeedback: string | undefined;
  let previousProgram: GeneratedProgram | undefined;
  try {
    const body = await req.json();
    clientId = body.clientId;
    guidelinesId = body.guidelinesId;
    regenerationFeedback = body.regenerationFeedback;
    previousProgram = body.previousProgram;
    if (!clientId || !guidelinesId) throw new Error("Missing fields");
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Requires clientId and guidelinesId." },
      { status: 400 }
    );
  }

  // Verify coach-client relationship
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relationship) {
    return NextResponse.json(
      { error: "Client not found or not assigned to you." },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------------
  // Fetch all data in parallel
  // ------------------------------------------------------------------
  const [
    { data: profile },
    { data: intake },
    { data: guidelines },
    { data: exercises },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, birthdate, gender, height_cm, weight_kg, training_age_years")
      .eq("id", clientId)
      .single(),
    supabase
      .from("client_intake")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("coach_guidelines")
      .select("*")
      .eq("id", guidelinesId)
      .single(),
    supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment, movement_pattern, difficulty, is_custom")
      .eq("is_archived", false)
      .order("is_custom", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (!guidelines) {
    return NextResponse.json(
      { error: "Coach guidelines not found." },
      { status: 404 }
    );
  }

  if (!exercises || exercises.length === 0) {
    return NextResponse.json(
      { error: "Exercise library is empty. Please seed exercises first." },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------------
  // Resolve exercise names for include/avoid lists
  // ------------------------------------------------------------------
  const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

  const includeNames = (guidelines.exercises_to_include as string[] | null)
    ?.map((id: string) => exerciseMap.get(id))
    .filter(Boolean) ?? [];

  const avoidNames = (guidelines.exercises_to_avoid as string[] | null)
    ?.map((id: string) => exerciseMap.get(id))
    .filter(Boolean) ?? [];

  // ------------------------------------------------------------------
  // Pre-filter exercises by client's available equipment
  // ------------------------------------------------------------------
  const clientEquipment = intake?.equipment_available as string[] | null;

  // "Full Gym" means all equipment — skip filtering entirely
  const hasFullGym = clientEquipment?.some((eq) => eq.toLowerCase().includes("full gym"));

  // Map intake labels to exercise.equipment values
  const equipmentKeywords = (clientEquipment ?? []).flatMap((eq) => {
    const lower = eq.toLowerCase();
    if (lower.includes("full gym")) return []; // handled above
    if (lower.includes("cables") || lower.includes("machines")) return ["cable", "machine"];
    if (lower.includes("dumbbells")) return ["dumbbell"];
    if (lower.includes("kettlebells")) return ["kettlebell"];
    if (lower.includes("bands")) return ["band", "resistance"];
    if (lower.includes("bodyweight")) return ["bodyweight"];
    return [lower]; // barbell, etc.
  });

  const filteredExercises =
    hasFullGym || !clientEquipment?.length
      ? exercises
      : exercises.filter(
          (e) =>
            !e.equipment ||
            e.equipment === "Bodyweight" ||
            equipmentKeywords.some((kw) =>
              e.equipment?.toLowerCase().includes(kw)
            )
        );

  // Use filtered list if it has enough variety, otherwise fall back to full list
  const libraryExercises =
    filteredExercises.length >= 30 ? filteredExercises : exercises;

  // ------------------------------------------------------------------
  // Build the exercise library text (compact format)
  // Foundational exercises listed first, marked with ★
  // ------------------------------------------------------------------
  const exerciseListText = libraryExercises
    .map(
      (e) =>
        `${e.is_custom ? "" : "★"}${e.id}|${e.name}|${e.muscle_group ?? "Other"}|${e.equipment ?? "None"}|${e.movement_pattern ?? "compound"}|${e.difficulty ?? "intermediate"}`
    )
    .join("\n");

  // ------------------------------------------------------------------
  // Build client profile section
  // ------------------------------------------------------------------
  let clientSection = `CLIENT PROFILE:\n- Name: ${profile?.full_name ?? "Unknown"}\n`;

  if (profile?.birthdate) {
    const birthDate = new Date(profile.birthdate);
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    clientSection += `- Age: ${age} years old\n`;
  }
  if (profile?.gender) {
    clientSection += `- Gender: ${profile.gender}\n`;
  }
  if (profile?.height_cm) {
    const totalIn = Math.round(profile.height_cm / 2.54);
    clientSection += `- Height: ${profile.height_cm} cm (${Math.floor(totalIn / 12)} ft ${totalIn % 12} in)\n`;
  }
  if (profile?.weight_kg) {
    clientSection += `- Weight: ${profile.weight_kg} kg (${Math.round(profile.weight_kg / 0.453592)} lbs)\n`;
  }
  if (profile?.training_age_years != null) {
    clientSection += `- Training experience: ${profile.training_age_years === 0 ? "Complete beginner" : `${profile.training_age_years} year${profile.training_age_years === 1 ? "" : "s"}`}\n`;
  }

  if (intake) {
    clientSection += `- Primary goal: ${intake.primary_goal ?? "Not specified"}\n`;
    clientSection += `- Secondary goal: ${intake.secondary_goal ?? "None"}\n`;
    clientSection += `- Days per week: ${intake.days_per_week ?? "Not specified"}\n`;
    clientSection += `- Session duration: ${intake.session_duration ? `${intake.session_duration} minutes` : "Not specified"}\n`;

    const focus = intake.training_focus as string[] | null;
    if (focus && focus.length > 0) {
      clientSection += `- Training focus: ${focus.join(", ")}\n`;
    }

    const equipment = intake.equipment_available as string[] | null;
    if (equipment && equipment.length > 0) {
      clientSection += `- Equipment available: ${equipment.join(", ")}\n`;
    }

    if (intake.injuries_limitations) {
      clientSection += `- Injuries / limitations: ${intake.injuries_limitations}\n`;
    }

    // PAR-Q flags
    const parqFlags: string[] = [];
    if (intake.parq_heart_condition) parqFlags.push("Heart condition");
    if (intake.parq_chest_pain_activity) parqFlags.push("Chest pain during activity");
    if (intake.parq_chest_pain_rest) parqFlags.push("Chest pain at rest");
    if (intake.parq_dizziness) parqFlags.push("Dizziness / fainting");
    if (intake.parq_bone_joint) parqFlags.push("Bone / joint problem");
    if (intake.parq_blood_pressure_meds) parqFlags.push("Blood pressure medication");
    if (intake.parq_other_reason) parqFlags.push("Other health reason");

    if (parqFlags.length > 0) {
      clientSection += `- PAR-Q flags: ${parqFlags.join(", ")}\n`;
      if (intake.parq_notes) {
        clientSection += `- PAR-Q notes: ${intake.parq_notes}\n`;
      }
    }
  } else {
    clientSection += `- NOTE: Client intake data is unavailable. Generate a balanced program based on the coach's guidelines.\n`;
  }

  // ------------------------------------------------------------------
  // Build coach guidelines section
  // ------------------------------------------------------------------
  let guidelinesSection = `COACH GUIDELINES:\n`;
  guidelinesSection += `- Program length: ${guidelines.program_length_weeks} weeks\n`;
  guidelinesSection += `- Intensity level: ${guidelines.intensity_level}\n`;
  guidelinesSection += `- Periodization style: ${guidelines.periodization_style}\n`;

  if (includeNames.length > 0) {
    guidelinesSection += `- Exercises to INCLUDE: ${includeNames.join(", ")}\n`;
  }
  if (avoidNames.length > 0) {
    guidelinesSection += `- Exercises to AVOID: ${avoidNames.join(", ")}\n`;
  }
  if (guidelines.additional_notes) {
    guidelinesSection += `\nCOACH'S SPECIFIC INSTRUCTIONS (high priority — follow these closely):\n${guidelines.additional_notes}\n`;
  }

  // ------------------------------------------------------------------
  // Build optional regeneration context
  // ------------------------------------------------------------------
  let regenerationSection = "";
  if (regenerationFeedback && previousProgram) {
    regenerationSection = `\nREGENERATION CONTEXT:
The coach has already reviewed a previously generated program and wants specific changes.

PREVIOUS PROGRAM (what was generated before):
${JSON.stringify(previousProgram)}

COACH'S REGENERATION FEEDBACK (highest priority — make these changes):
${regenerationFeedback}

IMPORTANT: Use the previous program as a starting point. Apply the coach's feedback to improve it. Keep what works, change what the coach asked to change.\n`;
  } else if (regenerationFeedback) {
    regenerationSection = `\nREGENERATION FEEDBACK (highest priority):
${regenerationFeedback}\n`;
  }

  // ------------------------------------------------------------------
  // Build the full user prompt
  // ------------------------------------------------------------------
  const userPrompt = `${clientSection}
${guidelinesSection}
${regenerationSection}EXERCISE LIBRARY (format: [★]id|name|muscle_group|equipment|movement_pattern|difficulty):
Exercises marked with ★ are foundational — STRONGLY prefer these. Only use unmarked (custom) exercises when no suitable ★ exercise exists for a movement pattern.
${exerciseListText}

OUTPUT: Return minified JSON (no extra whitespace) with this structure:
{"program_name":"string","program_description":"string","weeks":[{"week_number":1,"workouts":[{"day_of_week":"Monday","workout_name":"string","muscle_groups":["Chest","Triceps"],"exercises":[{"exercise_id":"uuid","sets":3,"reps":"8-10","rest_seconds":90,"notes":"optional cue","alternate_exercise_ids":["uuid"]}]}]}]}

Rules:
- exercise_id MUST match an id from the library above.
- 4-8 exercises per workout. rest_seconds 60-180.
- Respect periodization style and intensity level.
- Include specified exercises. Never use avoided exercises.
- day_of_week: full weekday name (Monday, Tuesday, etc.).
- NEVER use the same exercise twice in one workout. Each exercise_id in a workout must be unique. Choose diverse movement patterns (e.g. for back: 1 vertical pull, 1 horizontal row, 1 isolation — not 3 pull-up variations).
- Order exercises compound-first, isolation-last.
- STRONGLY prefer ★ (foundational) exercises. Build the program around proven, standard lifts (bench press, squat, deadlift, rows, overhead press, etc.). Only use advanced exercises (handstand push-ups, muscle-ups, etc.) if the client's training experience and the coach's notes specifically call for it.
- Match exercise difficulty to client experience: beginners get beginner/intermediate exercises, advanced clients can get advanced exercises.
- For each exercise, provide exactly 1 alternate_exercise_id that shares the same muscle_group, has similar movement_pattern, and prefers different equipment. Must not duplicate the original or be on the avoid list.
- Return ONLY valid JSON — no markdown, no explanation.`;

  const systemPrompt = `You are an expert personal trainer and strength & conditioning coach. Your job is to generate a complete, periodized training program based on the client's intake form and the coach's guidelines. You must only use exercises from the provided exercise library. Return your response as valid JSON only — no markdown, no explanation, just the JSON object.

PROGRAMMING PRINCIPLES (follow these strictly):
- EXERCISE VARIETY: Never repeat the same exercise twice in one workout. Each exercise in a workout must be a distinct movement. For example, do not program 3 pull-up variations on back day — pick one pull variation and complement it with rows, pulldowns, etc.
- MOVEMENT PATTERN BALANCE: Each workout should cover different movement patterns. For push day: a press, a fly, a dip variation, etc. For pull day: a vertical pull, a horizontal row, an isolation curl, etc. For legs: a squat pattern, a hinge pattern, a lunge, an isolation.
- COMPOUND FIRST: Order exercises from compound/multi-joint movements to isolation/single-joint movements within each workout.
- PROGRESSIVE OVERLOAD: If the program is multi-week, vary rep ranges and intensity across weeks according to the periodization style (e.g., linear: increase weight/decrease reps each week; undulating: alternate heavy/light days).
- REP RANGES: Strength = 3-6 reps, Hypertrophy = 8-12 reps, Endurance = 12-20 reps. Match the client's goals.
- MUSCLE GROUP COVERAGE: Over a training week, ensure all major muscle groups are trained. Don't over-concentrate on one area at the expense of others.
- SMART PAIRING: When programming supersets or same-day muscle groups, pair complementary groups (chest/triceps, back/biceps, quads/hamstrings) not competing ones.`;

  // ------------------------------------------------------------------
  // Call Claude API via SDK (handles timeouts properly)
  // ------------------------------------------------------------------
  try {
    const anthropic = new Anthropic({
      apiKey,
      timeout: 10 * 60 * 1000, // 10 minutes
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text" || !content.text) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 }
      );
    }

    // Check if response was truncated
    if (response.stop_reason === "max_tokens") {
      console.error("AI response truncated — hit max_tokens limit");
      return NextResponse.json(
        { error: "AI response was too long and got cut off. Please try again." },
        { status: 500 }
      );
    }

    // Parse the JSON response — strip markdown fences if present
    let program: GeneratedProgram;
    try {
      const jsonStr = content.text
        .replace(/```json?\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      program = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content.text.slice(0, 500));
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 500 }
      );
    }

    // Basic validation
    if (!program.weeks || !Array.isArray(program.weeks)) {
      return NextResponse.json(
        { error: "AI returned an invalid program structure." },
        { status: 500 }
      );
    }

    // Log AI activity
    await supabase.from("agent_activity_log").insert({
      client_id: clientId,
      action_type: "coach_program_generation",
      description: `Coach generated "${program.program_name}" — ${program.weeks.length} week program`,
      details: {
        coach_id: user.id,
        guidelines_id: guidelinesId,
        model: "claude-sonnet-4-6",
        weeks: program.weeks.length,
        total_workouts: program.weeks.reduce(
          (sum, w) => sum + w.workouts.length,
          0
        ),
        is_regeneration: !!regenerationFeedback,
        ...(regenerationFeedback && { regeneration_feedback: regenerationFeedback }),
      },
      ai_model: "claude-sonnet-4-6",
    });

    // Build exercise name lookup for client-side display
    const exerciseNames: Record<string, string> = {};
    for (const e of libraryExercises) {
      exerciseNames[e.id] = e.name;
    }

    return NextResponse.json({ program, exerciseNames });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
