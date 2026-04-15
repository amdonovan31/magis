import { redirect } from "next/navigation";

export default async function ReviewPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { programId?: string };
}) {
  // This page has been consolidated into the program edit page.
  if (searchParams.programId) {
    redirect(`/programs/${searchParams.programId}/edit`);
  }
  redirect("/programs");
}
