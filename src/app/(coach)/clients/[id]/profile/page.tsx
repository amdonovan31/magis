import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Link from "next/link";
import IntakeReadOnly from "@/components/intake/IntakeReadOnly";
import SendIntakeRequestButton from "@/components/intake/SendIntakeRequestButton";
import CoachPRSummary from "@/components/pr/CoachPRSummary";
import CoachMeasurementsSummary from "@/components/measurements/CoachMeasurementsSummary";
import WeightSection from "@/components/measurements/WeightSection";
import { getAllPRs } from "@/lib/queries/pr.queries";
import { getMeasurements } from "@/lib/queries/measurements.queries";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();

  if (!relationship) notFound();

  const [
    { data: profile },
    { data: intake },
    prs,
    measurements,
    weightMeasurements,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("client_intake")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getAllPRs(id),
    getMeasurements(id),
    getMeasurements(id, "weight", 200),
  ]);

  if (!profile) notFound();

  const age = profile.birthdate
    ? Math.floor(
        (Date.now() - new Date(profile.birthdate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <>
      <TopBar
        title="Client Profile"
        left={
          <Link
            href={`/clients/${id}`}
            className="text-sm text-primary/60 hover:text-primary"
          >
            &larr; {profile.full_name ?? "Back"}
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
        {/* Biometrics */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Biometrics
        </h3>
        <Card>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            {age !== null && (
              <div>
                <p className="text-primary/40 text-xs">Age</p>
                <p className="font-medium text-primary">{age}</p>
              </div>
            )}
            {profile.gender && (
              <div>
                <p className="text-primary/40 text-xs">Gender</p>
                <p className="font-medium text-primary">{profile.gender}</p>
              </div>
            )}
            {profile.height_cm && (
              <div>
                <p className="text-primary/40 text-xs">Height</p>
                <p className="font-medium text-primary">
                  {Math.floor(profile.height_cm / 2.54 / 12)}&apos;
                  {Math.round(profile.height_cm / 2.54) % 12}&quot;
                  <span className="text-primary/40 ml-1">
                    ({profile.height_cm} cm)
                  </span>
                </p>
              </div>
            )}
            {profile.weight_kg && (
              <div>
                <p className="text-primary/40 text-xs">Weight</p>
                <p className="font-medium text-primary">
                  {Math.round(profile.weight_kg / 0.453592)} lbs
                  <span className="text-primary/40 ml-1">
                    ({profile.weight_kg} kg)
                  </span>
                </p>
              </div>
            )}
            {profile.training_age_years !== null && (
              <div>
                <p className="text-primary/40 text-xs">Training experience</p>
                <p className="font-medium text-primary">
                  {profile.training_age_years === 0
                    ? "Brand new"
                    : profile.training_age_years === 1
                      ? "1 year"
                      : `${profile.training_age_years} years`}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Intake */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Intake
        </h3>
        {intake ? (
          <IntakeReadOnly intake={intake} />
        ) : profile.intake_requested ? (
          <p className="text-sm text-primary/60 italic">
            Intake request sent — waiting for client to complete.
          </p>
        ) : (
          <SendIntakeRequestButton clientId={id} />
        )}

        {/* Personal Records */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Personal Records
        </h3>
        <CoachPRSummary prs={prs} />

        {/* Weight Trend */}
        {weightMeasurements.length > 0 && (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
              Weight Trend
            </h3>
            <Card>
              <WeightSection
                measurements={weightMeasurements}
                unit={
                  (profile as Record<string, unknown>).preferred_unit as
                    | string
                    | undefined ?? "lbs"
                }
                showTrend
              />
            </Card>
          </>
        )}

        {/* Body Measurements */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Body Measurements
        </h3>
        <CoachMeasurementsSummary measurements={measurements} />
      </div>
    </>
  );
}
