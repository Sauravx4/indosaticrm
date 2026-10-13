import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders } from "@/lib/session";
import { download, fmtDate, inr, outstanding, paymentStage, PAYMENT_STAGES, toCSV } from "@/lib/crm";
import { DataTable, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payment Management — INDOSATI CRM" }, { name: "description", content: "Payment receipts and outstanding balances." }] }),
  component: Page,
});

function Page() {
  const { data: orders = [] } = useOrders();
  const [stage, setStage] = useState("");
  const q = useQuery({ queryKey: ["payments-all"], queryFn: async () => (await supabase.from("payments").select("*, orders(gem_order_number)").order("payment_date", { ascending: false })).data ?? [] });
  const live = orders.filter((o) => !o.cancelled && (!stage || paymentStage(o) === stage));
  const pays = q.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Payment Management" subtitle="Record payments from the order page. Balances are calculated automatically and cannot be edited." />
      <Section title="Order balances" action={
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-xs">
          <option value="">All stages</option>{PAYMENT_STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>}>
        <DataTable head={["GeM order", "Buyer", "Order value", "Received", "Outstanding", "Stage"]}
          rows={live.map((o) => [<OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—", inr(o.official_value), inr(o.amount_received),
            <span className={outstanding(o) < 0 ? "text-destructive" : ""}>{inr(outstanding(o))}</span>, <StatusPill status={paymentStage(o)} />])} />
      </Section>
      <Section title={`All payment receipts (${pays.length})`} action={
        <Button size="sm" variant="outline" onClick={() => download("payments.csv", toCSV(pays.map((p) => ({ Date: fmtDate(p.payment_date), "GeM Order": p.orders?.gem_order_number, Reference: p.transaction_ref, Method: p.method, Amount: Number(p.amount), Reversed: p.reversed ? "Yes" : "No" }))))}>Export CSV</Button>}>
        <DataTable head={["Date", "GeM order", "Reference", "Method", "Amount", "Status"]}
          rows={pays.map((p) => [fmtDate(p.payment_date), <OrderLink id={p.order_id} label={p.orders?.gem_order_number ?? ""} />, p.transaction_ref, p.method, inr(p.amount), p.reversed ? <StatusPill status="Reversed" /> : <StatusPill status="Valid" />])} />
      </Section>
    </div>
  );
}
