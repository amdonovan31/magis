import { notFound } from "next/navigation";
import { getProgramWithTemplates } from "@/lib/queries/program.queries";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgramWithTemplates(id);

  if (!program) notFound();

  return (
    <>
      <TopBar
        title={program.title}
        left={
          <Link href="/programs" className="text-sm text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {program.description && (
          <p className="text-sm text-primary/60">{program.description}</p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={program.is_active ? "success" : "default"}>
            {program.is_active ? "Active" : "Inactive"}
          </Badge>
          {program.starts_on && (
            <span className="text-xs text-primary/40">
              Starts {program.starts_on}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Workout Days
        </h3>

        {program.workout_templates.length === 0 ? (
          <p className="text-sm text-primary/40 italic">No workout days added yet.</p>
        ) : (
          program.workout_templates.map((template) => (
            <Card key={template.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-primary">{template.title}</p>
                  {template.notes && (
                    <p className="mt-1 text-sm text-primary/60">{template.notes}</p>
                  )}
                </div>
                {template.day_number != null && (
                  <Badge>Day {template.day_number}</Badge>
                )}
              </div>

              {template.exercises.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  {template.exercises.map((te) => (
                    <div
                      key={te.id}
                      className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm"
                    >
                      <span className="text-primary">{te.exercise.name}</span>
                      <span className="text-primary/50">
                        {te.prescribed_sets && `${te.prescribed_sets}×`}
                        {te.prescribed_reps ?? ""}
                        {te.prescribed_weight ? ` @ ${te.prescribed_weight}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
