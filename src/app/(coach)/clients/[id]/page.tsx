import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/date";

export default async function ClientDetailPage({
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

  // Verify this client belongs to the coach
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();

  if (!relationship) notFound();

  // Get client profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Get client's programs
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .eq("client_id", id)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  // Get recent sessions
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*, workout_template:workout_templates(title)")
    .eq("client_id", id)
    .order("started_at", { ascending: false })
    .limit(10);

  return (
    <>
      <TopBar
        title={profile.full_name ?? "Client"}
        left={
          <Link href="/clients" className="text-sm text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {/* Profile Header */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {profile.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-semibold text-primary">
                {profile.full_name ?? "Unnamed Client"}
              </p>
              <p className="text-sm text-primary/50">Client</p>
            </div>
          </div>
        </Card>

        {/* Programs */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Programs
        </h3>
        {!programs?.length ? (
          <p className="text-sm text-primary/40 italic">No programs assigned.</p>
        ) : (
          programs.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card className="active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-primary">{program.title}</p>
                  <Badge variant={program.is_active ? "success" : "default"}>
                    {program.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))
        )}

        {/* Recent Sessions */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Recent Sessions
        </h3>
        {!sessions?.length ? (
          <p className="text-sm text-primary/40 italic">No sessions yet.</p>
        ) : (
          sessions.map((session) => {
            const template = session.workout_template as { title: string } | null;
            return (
              <Card key={session.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">
                      {template?.title ?? "Workout"}
                    </p>
                    {session.started_at && (
                      <p className="text-xs text-primary/40">
                        {formatRelativeTime(session.started_at)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      session.status === "completed"
                        ? "success"
                        : session.status === "skipped"
                          ? "default"
                          : "accent"
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
