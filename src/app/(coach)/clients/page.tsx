import { getCoachDashboard } from "@/lib/queries/coach.queries";
import { redirect } from "next/navigation";
import ClientCard from "@/components/coach/ClientCard";
import Link from "next/link";
import Button from "@/components/ui/Button";
import TopBar from "@/components/layout/TopBar";

export default async function ClientsPage() {
  const data = await getCoachDashboard();
  if (!data) redirect("/login");

  const { clients } = data;

  return (
    <>
      <TopBar
        title="Clients"
        right={
          <Link href="/clients/invite">
            <Button size="sm" variant="accent">+ Invite</Button>
          </Link>
        }
      />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-10 text-center shadow-sm">
            <p className="text-primary/60">No clients yet.</p>
            <Link href="/clients/invite">
              <Button>Invite your first client</Button>
            </Link>
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard key={client.profile.id} client={client} />
          ))
        )}
      </div>
    </>
  );
}
