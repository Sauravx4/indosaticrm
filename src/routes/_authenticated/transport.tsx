import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, todayISO } from "@/lib/crm";
import { DataTable, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";

export const Route = createFileRoute("/_authenticated/transport")({
  head: () => ({ meta: [{ title: "Transport & Tracking — INDOSATI CRM" }, { name: "description", content: "Shipment and delivery tracking." }] }),
  component: Page,
});

function Page() {
  const [f, setF] = useState("open");
  const [tr, setTr] = useState("");
  const q = useQuery({ queryKey: ["dispatch-all"], queryFn: async () => (await supabase.from("dispatches").select("*, orders(gem_order_number, buyers(name))").order("dispatch_date", { ascending: false })).data ?? [] });
  const t = todayISO();
  const all = q.data ?? [];
  const transporters = [...new Set(all.map((d) => d.transporter).filter(Boolean))] as string[];
  const rows = all.filter((d) => (f === "open" ? !d.buyer_received_date : f === "done" ? !!d.buyer_received_date : true) && (!tr || d.transporter === tr));
  return (
    <div>
      <PageHeader title="Transport & Tracking" subtitle="Delivery is only marked when the buyer receipt date is entered on the order page." actions={<>
        <select value={tr} onChange={(e) => setTr(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm"><option value="">All transporters</option>{transporters.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={f} onChange={(e) => setF(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm"><option value="open">Awaiting delivery</option><option value="done">Delivered</option><option value="">All</option></select>
      </>} />
      <Section title={`${rows.length} shipments`}>
        <DataTable head={["GeM order", "Buyer", "Transporter", "Docket", "Dispatched", "Expected", "Buyer received", "Status"]}
          rows={rows.map((d) => [<OrderLink id={d.order_id} label={d.orders?.gem_order_number ?? ""} />, d.orders?.buyers?.name ?? "—", d.transporter ?? "—", d.docket_number ?? "—", fmtDate(d.dispatch_date),
            <span className={!d.buyer_received_date && d.expected_delivery && d.expected_delivery < t ? "text-destructive" : ""}>{fmtDate(d.expected_delivery)}</span>,
            fmtDate(d.buyer_received_date), <StatusPill status={d.delivery_status} />])} />
      </Section>
    </div>
  );
}
