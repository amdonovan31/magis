import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GeneratedExercise {
  exercise_id: string;
  exercise_name: string;
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
  focus: string;
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
  try {
    const body = await req.json();
    clientId = body.clientId;
    guidelinesId = body.guidelinesId;
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
      .select("id, name, muscle_group, equipment, movement_pattern")
      .eq("is_archived", false)
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
  // Build the exercise library text
  // ------------------------------------------------------------------
  const exerciseListText = exercises
    .map(
      (e, i) =>
        `${i + 1}. ${e.name} | id: ${e.id} | muscle_group: ${e.muscle_group ?? "Other"} | equipment: ${e.equipment ?? "None"} | movement: ${e.movement_pattern ?? "compound"}`
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
    guidelinesSection += `- Additional coaching notes: ${guidelines.additional_notes}\n`;
  }

  // ------------------------------------------------------------------
  // Build the full user prompt
  // ------------------------------------------------------------------
  const userPrompt = `${clientSection}
${guidelinesSection}
EXERCISE LIBRARY (you MUST only use exercise IDs from this list):
${exerciseListText}

OUTPUT INSTRUCTIONS:
Generate a complete ${guidelines.program_length_weeks}-week training program.
Return ONLY a JSON object in exactly this structure — no markdown, no explanation, just the JSON:

{
  "program_name": "string",
  "program_description": "string",
  "weeks": [
    {
      "week_number": 1,
      "focus": "string describing this week's focus",
      "workouts": [
        {
          "day_of_week": "Monday",
          "workout_name": "string",
          "muscle_groups": ["Chest", "Triceps"],
          "exercises": [
            {
              "exercise_id": "uuid from exercise library",
              "exercise_name": "string",
              "sets": 3,
              "reps": "8-10",
              "rest_seconds": 90,
              "notes": "optional coaching cue",
              "alternate_exercise_ids": ["uuid", "uuid"]
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Every exercise_id MUST match an id from the exercise library above.
- Each workout should have 4-8 exercises.
- rest_seconds should be 60-180 based on exercise intensity.
- Respect the coach's periodization style and intensity level.
- If exercises to include are specified, ensure they appear in the program.
- If exercises to avoid are specified, never use them.
- day_of_week must be a full weekday name (Monday, Tuesday, etc.).
- For each exercise, provide 1-2 alternate_exercise_ids from the library that:
  (a) Share the same muscle_group as the original exercise.
  (b) Have a similar movement_pattern (push stays push, hinge stays hinge, isolation stays isolation).
  (c) Prefer different equipment from the original (e.g. if original is Barbell, prefer Dumbbell or Machine).
  (d) Do not duplicate the original exercise_id or each other.
  (e) Do not use any exercises from the avoid list.`;

  const systemPrompt = `You are an expert personal trainer and strength & conditioning coach. Your job is to generate a complete, periodized training program based on the client's intake form and the coach's guidelines. You must only use exercises from the provided exercise library. Return your response as valid JSON only — no markdown, no explanation, just the JSON object.`;

  // ------------------------------------------------------------------
  // Call Claude API
  // ------------------------------------------------------------------
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 32000,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 }
      );
    }

    // Check if response was truncated
    if (data.stop_reason === "max_tokens") {
      console.error("AI response truncated — hit max_tokens limit");
      return NextResponse.json(
        { error: "AI response was too long and got cut off. Please try again." },
        { status: 500 }
      );
    }

    // Parse the JSON response — strip markdown fences if present
    let program: GeneratedProgram;
    try {
      const jsonStr = content
        .replace(/```json?\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      program = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content.slice(0, 500));
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
      },
      ai_model: "claude-sonnet-4-6",
    });

    return NextResponse.json({ program });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
