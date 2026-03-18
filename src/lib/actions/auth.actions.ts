"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { IntakeData } from "@/lib/actions/intake.actions";
import { logger } from "@/lib/utils/logger";

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const role = (formData.get("role") as string) || "coach";

  if (!email || !password || !fullName) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (role !== "coach" && role !== "solo" && role !== "client") {
    return { error: "Invalid role" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (role === "solo") {
    redirect("/onboarding");
  } else if (role === "coach") {
    redirect("/dashboard");
  } else {
    redirect("/home");
  }
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const role = data.user?.app_metadata?.role as "coach" | "client" | "solo" | undefined;

  // Solo and client users who haven't completed onboarding
  if (role === "solo" || role === "client") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", data.user.id)
      .single();

    if (!profile?.onboarding_complete) {
      redirect("/onboarding");
    }
  }

  // Multi-role users see the role picker
  const { data: roleProfile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", data.user.id)
    .single();

  if (roleProfile && roleProfile.roles.length > 1) {
    redirect("/choose-role");
  }

  if (role === "coach") {
    redirect("/dashboard");
  } else {
    redirect("/home");
  }
}

export async function completeOnboarding(input: {
  fullName: string;
  password?: string;
  birthdate: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  trainingAgeYears: number;
  intakeData: IntakeData;
}): Promise<{
  error?: string;
  programTitle?: string;
  explanation?: string;
  dayCount?: number;
} | void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Set password if provided (invited clients)
  if (input.password) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: input.password,
    });
    if (passwordError) {
      return { error: passwordError.message };
    }
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      birthdate: input.birthdate,
      gender: input.gender,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      training_age_years: input.trainingAgeYears,
      onboarding_complete: true,
      intake_requested: false,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const coachId = user.app_metadata?.coach_id as string | undefined;

  // Save intake data for all roles
  const { error: intakeError } = await supabase.from("client_intake").insert({
    client_id: user.id,
    coach_id: coachId ?? null,
    ...input.intakeData,
  });

  if (intakeError) {
    logger.error("Intake insert error", { error: intakeError });
  }

  const role = user.app_metadata?.role;

  // Solo users get an AI-generated program
  if (role === "solo") {
    const { generateSoloProgram } = await import("@/lib/actions/ai.actions");
    return generateSoloProgram({
      goals: [input.intakeData.primary_goal, input.intakeData.secondary_goal].filter(Boolean) as string[],
      equipment: input.intakeData.equipment_available,
      daysPerWeek: input.intakeData.days_per_week,
      birthdate: input.birthdate,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      trainingAgeYears: input.trainingAgeYears,
      intakeData: input.intakeData,
    });
  }

  // Clients redirect to home
  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function inviteClient(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "coach") {
    return { error: "Unauthorized" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      role: "client",
      coach_id: user.id,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
