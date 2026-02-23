import { getCoachClients } from "@/lib/queries/coach.queries";
import { getExercises } from "@/lib/queries/exercise.queries";
import ProgramBuilder from "@/components/coach/ProgramBuilder";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";

export default async function NewProgramPage() {
  const [clients, exercises] = await Promise.all([
    getCoachClients(),
    getExercises(),
  ]);

  const clientsList = (clients as Array<{ id: string; full_name: string | null }>).map((c) => ({
    id: c.id,
    full_name: c.full_name,
  }));

  return (
    <>
      <TopBar
        title="New Program"
        left={
          <Link href="/programs" className="text-primary/60 hover:text-primary text-sm">
            ← Back
          </Link>
        }
      />
      <div className="px-4 pt-4 pb-8">
        <ProgramBuilder clients={clientsList} exercises={exercises} />
      </div>
    </>
  );
}
