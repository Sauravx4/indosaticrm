import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, PageHeader, Section, StatusPill } from "@/components/crm/ui";

export const Route = createFileRoute("/_authenticated/sheets")({
  head: () => ({ meta: [{ title: "Google Sheets Integration — INDOSATI CRM" }, { name: "description", content: "Sync the CRM to the Master Register spreadsheet." }] }),
  component: Page,
});

const TABS = ["Order Master", "Order Items", "Buyer Master", "Dispatch Records", "Delivery Tracking", "CRAC Records", "Payment Records", "SMS Logs", "Dashboard Summary"];

function Page() {
  const logs = useQuery({ queryKey: ["sync-logs"], queryFn: async () => (await supabase.from("sync_logs").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [] });
  return (
    <div className="space-y-6">
      <PageHeader title="Google Sheets Integration" subtitle="The CRM database stays the master record; the spreadsheet is a one-way copy." />
      <div className="rounded-lg border border-warning bg-warning/10 p-4 text-sm">
        <b>Not connected yet.</b> Your Google account will be connected in the next build stage. Until then nothing is copied to Sheets.
      </div>
      <Section title="Planned spreadsheet: INDOSATI — GeM Seller CRM Master Register">
        <ul className="grid gap-2 p-4 text-sm sm:grid-cols-3">{TABS.map((t, i) => <li key={t} className="rounded border px-3 py-2">{i + 1}. {t}</li>)}</ul>
      </Section>
      <Section title="Sync log">
        <DataTable head={["When", "Record type", "Status", "Attempts", "Error"]} rows={(logs.data ?? []).map((l) => [new Date(l.created_at).toLocaleString("en-IN"), l.entity, <StatusPill status={l.status} />, l.attempts, l.error ?? ""])} />
      </Section>
    </div>
  );
}
