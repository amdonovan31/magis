import { getCoachPrograms } from "@/lib/queries/program.queries";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import type { Program } from "@/types/app.types";

type ProgramWithClient = Program & {
  client: { id: string; full_name: string | null } | null;
};

export default async function ProgramsPage() {
  const rawPrograms = await getCoachPrograms();
  const programs = rawPrograms as unknown as ProgramWithClient[];

  return (
    <>
      <TopBar
        title="Programs"
        right={
          <Link href="/programs/new">
            <Button size="sm" variant="accent">+ New</Button>
          </Link>
        }
      />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-10 text-center shadow-sm">
            <p className="text-primary/60">No programs yet.</p>
            <Link href="/programs/new">
              <Button>Create your first program</Button>
            </Link>
          </div>
        ) : (
          programs.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card className="active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary truncate">{program.title}</p>
                    {program.client ? (
                      <p className="text-sm text-primary/60">{program.client.full_name}</p>
                    ) : (
                      <p className="text-sm text-primary/40 italic">Unassigned</p>
                    )}
                  </div>
                  <Badge variant={program.is_active ? "success" : "default"}>
                    {program.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {program.description && (
                  <p className="mt-2 text-sm text-primary/60 line-clamp-2">
                    {program.description}
                  </p>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
