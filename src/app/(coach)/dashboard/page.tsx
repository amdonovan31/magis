import { getCoachDashboard } from "@/lib/queries/coach.queries";
import { redirect } from "next/navigation";
import ClientCard from "@/components/coach/ClientCard";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const data = await getCoachDashboard();
  if (!data) redirect("/login");

  const { coach, clients } = data;

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary/60">Good to see you,</p>
          <h1 className="text-2xl font-bold text-primary">
            {coach.full_name?.split(" ")[0] ?? "Coach"}
          </h1>
        </div>
        <Link href="/clients/invite">
          <Button size="sm" variant="accent">+ Invite Client</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary p-4 text-white">
          <p className="text-3xl font-bold">{clients.length}</p>
          <p className="text-sm text-white/70">Active Clients</p>
        </div>
        <div className="rounded-2xl bg-accent p-4 text-white">
          <p className="text-3xl font-bold">
            {clients.filter((c) => c.activeProgram).length}
          </p>
          <p className="text-sm text-white/70">On Programs</p>
        </div>
      </div>

      {/* Client list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary">My Clients</h2>
          <Link href="/clients" className="text-sm text-accent font-medium">
            View all
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-10 text-center shadow-sm">
            <p className="text-primary/60">No clients yet.</p>
            <Link href="/clients/invite">
              <Button size="sm">Invite your first client</Button>
            </Link>
          </div>
        ) : (
          clients.slice(0, 5).map((client) => (
            <ClientCard key={client.profile.id} client={client} />
          ))
        )}
      </div>
    </div>
  );
}
