import { getExercises } from "@/lib/queries/exercise.queries";
import ExerciseLibraryClient from "./ExerciseLibraryClient";
import TopBar from "@/components/layout/TopBar";

export default async function LibraryPage() {
  const exercises = await getExercises();

  return (
    <>
      <TopBar title="Exercise Library" />
      <ExerciseLibraryClient initialExercises={exercises} />
    </>
  );
}
