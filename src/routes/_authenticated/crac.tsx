import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders } from "@/lib/session";
import { fmtDate, inr, paymentStage } from "@/lib/crm";
import { DataTable, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";

export const Route = createFileRoute("/_authenticated/crac")({
  head: () => ({ meta: [{ title: "CRAC Management — INDOSATI CRM" }, { name: "description", content: "Track CRAC generation and follow-ups." }] }),
  component: Page,
});

function Page() {
  const { data: orders = [] } = useOrders();
  const [f, setF] = useState("");
  const q = useQuery({ queryKey: ["crac-all"], queryFn: async () => (await supabase.from("crac_records").select("*, orders(gem_order_number, buyers(name))").order("created_at", { ascending: false })).data ?? [] });
  const awaiting = orders.filter((o) => !o.cancelled && paymentStage(o) === "CRAC Awaited");
  const recs = (q.data ?? []).filter((c) => !f || c.status === f);
  return (
    <div className="space-y-6">
      <PageHeader title="CRAC Management" subtitle="CRAC is only marked generated when its number and date are entered." />
      <Section title={`Delivered orders with no CRAC generated (${awaiting.length})`}>
        <DataTable head={["GeM order", "Buyer", "Value", "Deliveries"]} rows={awaiting.map((o) => [<OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—", inr(o.official_value), `${o.delivered_count}/${o.dispatch_count}`])} />
      </Section>
      <Section title="CRAC records" action={
        <select value={f} onChange={(e) => setF(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-xs">
          <option value="">All statuses</option>{["Dispatch Not Completed", "Awaiting Buyer Receipt", "Delivered — CRAC Pending", "CRAC Generated", "CRAC Issue or Clarification Required"].map((s) => <option key={s}>{s}</option>)}
        </select>}>
        <DataTable head={["GeM order", "Buyer", "Invoice", "CRAC no.", "CRAC date", "Follow-up", "Status"]}
          rows={recs.map((c) => [<OrderLink id={c.order_id} label={c.orders?.gem_order_number ?? ""} />, c.orders?.buyers?.name ?? "—", c.invoice_number ?? "—", c.crac_number ?? "—", fmtDate(c.crac_date), fmtDate(c.follow_up_date), <StatusPill status={c.status} />])} />
      </Section>
    </div>
  );
}
