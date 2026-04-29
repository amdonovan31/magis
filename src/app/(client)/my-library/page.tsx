import { getSavedWorkouts } from "@/lib/queries/saved-workout.queries";
import TopBar from "@/components/layout/TopBar";
import SavedWorkoutsList from "@/components/library/SavedWorkoutsList";

export default async function MyLibraryPage() {
  const savedWorkouts = await getSavedWorkouts();

  return (
    <>
      <TopBar title="Library" />
      <div className="px-4 pt-4 pb-24">
        {savedWorkouts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold text-primary">No saved workouts yet</p>
            <p className="text-sm text-primary/50 mt-1 max-w-[260px]">
              Save workouts from your completed sessions or programs to build
              your library.
            </p>
          </div>
        ) : (
          <SavedWorkoutsList workouts={savedWorkouts} />
        )}
      </div>
    </>
  );
}
