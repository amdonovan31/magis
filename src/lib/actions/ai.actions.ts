"use server";

import { createClient } from "@/lib/supabase/server";
import { getAllExerciseNames } from "@/lib/queries/exercise.queries";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";
import type { IntakeData } from "@/lib/actions/intake.actions";

interface GenerateProgramInput {
  goals: string[];
  equipment: string[];
  daysPerWeek: number;
  birthdate?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  trainingAgeYears?: number;
  intakeData?: IntakeData;
}

interface GeneratedExercise {
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

interface GeneratedDay {
  title: string;
  day_number: number;
  scheduled_days: number[];
  exercises: GeneratedExercise[];
}

interface GeneratedProgram {
  title: string;
  description: string;
  explanation: string;
  days: GeneratedDay[];
}

export async function generateSoloProgram(input: GenerateProgramInput): Promise<{
  error?: string;
  programTitle?: string;
  explanation?: string;
  dayCount?: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error:
        "AI program generation is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch available exercises and profile data in parallel
  const [exercises, { data: profileData }] = await Promise.all([
    getAllExerciseNames(),
    supabase
      .from("profiles")
      .select("birthdate, gender, height_cm, weight_kg, training_age_years")
      .eq("id", user.id)
      .single(),
  ]);
  const exerciseList = exercises
    .map((e) => `${e.name} (${e.muscle_group ?? "Other"})`)
    .join(", ");

  // Use passed-in values or fall back to profile data from DB
  const birthdate = input.birthdate ?? profileData?.birthdate;
  const gender = input.gender ?? profileData?.gender;
  const heightCm = input.heightCm ?? profileData?.height_cm;
  const weightKg = input.weightKg ?? profileData?.weight_kg;
  const trainingAgeYears = input.trainingAgeYears ?? profileData?.training_age_years;

  // Build client profile section for the prompt
  let clientProfileSection = "";
  if (birthdate) {
    const birthDate = new Date(birthdate);
    const clientAge = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    clientProfileSection += `- Age: ${clientAge} years old\n`;
  }
  if (gender) clientProfileSection += `- Gender: ${gender}\n`;
  if (heightCm) {
    const totalIn = Math.round(heightCm / 2.54);
    clientProfileSection += `- Height: ${heightCm} cm (${Math.floor(totalIn / 12)} ft ${totalIn % 12} in)\n`;
  }
  if (weightKg) {
    clientProfileSection += `- Weight: ${weightKg} kg (${Math.round(weightKg / 0.453592)} lbs)\n`;
  }
  if (trainingAgeYears != null) {
    clientProfileSection += `- Training experience: ${trainingAgeYears === 0 ? "Complete beginner" : `${trainingAgeYears} year${trainingAgeYears === 1 ? "" : "s"}`}\n`;
  }

  // Build health & intake section from PAR-Q and intake data
  let healthSection = "";
  const intake = input.intakeData;
  if (intake) {
    const parqFlags: string[] = [];
    if (intake.parq_heart_condition) parqFlags.push("heart condition");
    if (intake.parq_chest_pain_activity) parqFlags.push("chest pain during activity");
    if (intake.parq_chest_pain_rest) parqFlags.push("chest pain at rest");
    if (intake.parq_dizziness) parqFlags.push("dizziness/balance issues");
    if (intake.parq_bone_joint) parqFlags.push("bone/joint problems");
    if (intake.parq_blood_pressure_meds) parqFlags.push("blood pressure medication");
    if (intake.parq_other_reason) parqFlags.push("other health concern");

    if (parqFlags.length > 0) {
      healthSection += `- PAR-Q flags: ${parqFlags.join(", ")}\n`;
    }
    if (intake.parq_notes) {
      healthSection += `- Health notes: ${intake.parq_notes}\n`;
    }
    if (intake.injuries_limitations) {
      healthSection += `- Injuries/limitations: ${intake.injuries_limitations}\n`;
    }
    if (intake.training_focus.length > 0) {
      healthSection += `- Training focus: ${intake.training_focus.join(", ")}\n`;
    }
    if (intake.session_duration) {
      healthSection += `- Preferred session duration: ${intake.session_duration} minutes\n`;
    }
  }

  const prompt = `You are a certified personal trainer creating a ${input.daysPerWeek}-day per week training program.

${clientProfileSection ? `CLIENT PROFILE:\n${clientProfileSection}` : ""}${healthSection ? `HEALTH & PREFERENCES:\n${healthSection}\n` : ""}Client goals: ${input.goals.join(", ")}
Available equipment: ${input.equipment.join(", ")}
Days per week: ${input.daysPerWeek}

Available exercises in the database (prefer these, but you may suggest new ones if needed):
${exerciseList}

Create a 4-week training program. Return ONLY valid JSON with this exact structure:
{
  "title": "Program Name",
  "description": "Brief program description",
  "explanation": "2-3 sentences explaining the program structure and why it suits the client's goals",
  "days": [
    {
      "title": "Day Name (e.g. Upper Body A)",
      "day_number": 1,
      "scheduled_days": [1, 3],
      "exercises": [
        {
          "name": "Exercise Name",
          "muscle_group": "Chest",
          "sets": 3,
          "reps": "8-12",
          "rest_seconds": 90
        }
      ]
    }
  ]
}

Rules:
- scheduled_days uses 0=Sunday through 6=Saturday. Spread workouts across the week.
- Each day should have 4-6 exercises.
- Use exercise names from the provided list when possible.
- Valid muscle groups: Chest, Back, Shoulders, Biceps, Triceps, Legs, Quads, Hamstrings, Glutes, Core, Calves, Full Body, Cardio.
- rest_seconds should be between 60-180 based on exercise intensity.
- If PAR-Q flags or injuries are present, avoid exercises that could aggravate those conditions and prefer safer alternatives.
- Return ONLY the JSON object, no markdown fences or extra text.`;

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
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error("Anthropic API error", { body: errBody });
      return { error: "Failed to generate program. Please try again." };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) {
      return { error: "Empty response from AI. Please try again." };
    }

    // Parse the JSON response
    let program: GeneratedProgram;
    try {
      // Strip any markdown fences if present
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      program = JSON.parse(jsonStr);
    } catch {
      logger.error("Failed to parse AI response", { content });
      return { error: "Invalid AI response. Please try again." };
    }

    // Build a lookup of existing exercises by lowercase name
    const exerciseMap = new Map(
      exercises.map((e) => [e.name.toLowerCase(), e.id])
    );

    // Insert the program
    const { data: programRow, error: programError } = await supabase
      .from("programs")
      .insert({
        coach_id: user.id,
        client_id: user.id,
        title: program.title,
        description: program.description,
        is_active: true,
      })
      .select("id")
      .single();

    if (programError || !programRow) {
      logger.error("Program insert error", { error: programError });
      return { error: "Failed to save program." };
    }

    // Insert each day's template and exercises
    for (const day of program.days) {
      const { data: templateRow, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          program_id: programRow.id,
          title: day.title,
          day_number: day.day_number,
          scheduled_days: day.scheduled_days,
        })
        .select("id")
        .single();

      if (templateError || !templateRow) {
        logger.error("Template insert error", { error: templateError });
        continue;
      }

      // Insert exercises for this template
      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        let exerciseId = exerciseMap.get(ex.name.toLowerCase());

        // Create the exercise if it doesn't exist
        if (!exerciseId) {
          const { data: newEx } = await supabase
            .from("exercises")
            .insert({
              created_by: user.id,
              name: ex.name,
              muscle_group: ex.muscle_group,
            })
            .select("id")
            .single();

          if (newEx) {
            exerciseId = newEx.id;
            exerciseMap.set(ex.name.toLowerCase(), exerciseId);
          }
        }

        if (!exerciseId) continue;

        await supabase.from("workout_template_exercises").insert({
          workout_template_id: templateRow.id,
          exercise_id: exerciseId,
          position: i + 1,
          prescribed_sets: ex.sets,
          prescribed_reps: ex.reps,
          rest_seconds: ex.rest_seconds,
        });
      }
    }

    // Mark onboarding complete
    await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    // Log AI activity
    await supabase.from("agent_activity_log").insert({
      client_id: user.id,
      action_type: "program_generation",
      description: `AI generated "${program.title}" — ${program.days.length} day program`,
      details: {
        goals: input.goals,
        equipment: input.equipment,
        daysPerWeek: input.daysPerWeek,
      },
      ai_model: "claude-sonnet-4-6",
    });

    revalidatePath("/home");

    return {
      programTitle: program.title,
      explanation: program.explanation,
      dayCount: program.days.length,
    };
  } catch (err) {
    logger.error("AI generation error", { error: String(err) });
    return { error: "Failed to generate program. Please try again." };
  }
}
