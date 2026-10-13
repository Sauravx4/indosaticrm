import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders } from "@/lib/session";
import { addDays, daysBetween, dispatchStatus, fmtDate, inr, outstanding, paymentStage, todayISO } from "@/lib/crm";
import { DataTable, Kpi, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — INDOSATI GeM CRM" }, { name: "description", content: "Live overview of GeM orders, dispatches and payments." }] }),
  component: Dashboard,
});

const RANGES = { all: "All time", today: "Today", week: "This week", month: "This month", prev: "Previous month", custom: "Custom" } as const;

function rangeBounds(r: keyof typeof RANGES, from: string, to: string): [string, string] | null {
  const t = todayISO();
  const d = new Date(t);
  if (r === "today") return [t, t];
  if (r === "week") return [addDays(t, -((d.getUTCDay() + 6) % 7)), t];
  if (r === "month") return [t.slice(0, 8) + "01", t];
  if (r === "prev") {
    const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
    const e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
    return [p.toISOString().slice(0, 10), e.toISOString().slice(0, 10)];
  }
  if (r === "custom" && from && to) return [from, to];
  return null;
}

function Dashboard() {
  const { data: all = [], isLoading } = useOrders();
  const [range, setRange] = useState<keyof typeof RANGES>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const payments = useQuery({ queryKey: ["recent-payments"], queryFn: async () => (await supabase.from("payments").select("*, orders(gem_order_number)").order("payment_date", { ascending: false }).limit(8)).data ?? [] });
  const sms = useQuery({ queryKey: ["recent-sms"], queryFn: async () => (await supabase.from("sms_notifications").select("*, orders(gem_order_number)").order("created_at", { ascending: false }).limit(8)).data ?? [] });

  const b = rangeBounds(range, from, to);
  const orders = useMemo(() => (b ? all.filter((o) => o.order_date! >= b[0] && o.order_date! <= b[1]) : all), [all, b?.[0], b?.[1]]);
  const t = todayISO();
  const live = orders.filter((o) => !o.cancelled);
  const st = (o: (typeof orders)[number]) => dispatchStatus(o);
  const awaiting = live.filter((o) => ["Pending Dispatch", "Dispatch Due Soon", "Dispatch Overdue", "Partially Dispatched"].includes(st(o)));
  const dueSoon = awaiting.filter((o) => { const d = daysBetween(t, o.dispatch_deadline!); return d >= 0 && d <= 5; });
  const overdue = awaiting.filter((o) => daysBetween(t, o.dispatch_deadline!) < 0);
  const awaitingDelivery = live.filter((o) => Number(o.dispatch_count) > Number(o.delivered_count));
  const awaitingCrac = live.filter((o) => paymentStage(o) === "CRAC Awaited");
  const cracNoPay = live.filter((o) => paymentStage(o) === "Payment Awaited");
  const partial = live.filter((o) => paymentStage(o) === "Part Payment Received");
  const full = live.filter((o) => paymentStage(o) === "Full Payment Received");
  const withBal = live.filter((o) => outstanding(o) > 0);
  const sum = (xs: typeof orders, f: (o: (typeof orders)[number]) => number) => xs.reduce((a, o) => a + f(o), 0);
  const thisMonth = all.filter((o) => o.order_date!.slice(0, 7) === t.slice(0, 7)).length;

  const orow = (o: (typeof orders)[number], extra: React.ReactNode[] = []) => [
    <OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—", ...extra,
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Live from the database · ${fmtDate(t)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select value={range} onChange={(e) => setRange(e.target.value as never)} className="h-9 rounded-md border bg-card px-2 text-sm">
              {Object.entries(RANGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {range === "custom" && (<>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm" />
            </>)}
          </div>
        } />
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (<>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <Kpi label="Total GeM orders" value={orders.length} to="/orders" />
          <Kpi label="Received this month" value={thisMonth} to="/orders" search={{ view: "month" }} />
          <Kpi label="Total order value" value={inr(sum(live, (o) => Number(o.official_value)))} to="/orders" />
          <Kpi label="Amount dispatched" value={inr(sum(live, (o) => Number(o.dispatched_value)))} to="/dispatch" />
          <Kpi label="Awaiting dispatch" value={awaiting.length} to="/orders" search={{ view: "awaiting" }} />
          <Kpi label="Deadline within 5 days" value={dueSoon.length} to="/orders" search={{ view: "duesoon" }} tone="warning" />
          <Kpi label="Overdue dispatch" value={overdue.length} to="/orders" search={{ view: "overdue" }} tone="danger" />
          <Kpi label="Awaiting delivery" value={awaitingDelivery.length} to="/transport" />
          <Kpi label="Delivered, awaiting CRAC" value={awaitingCrac.length} to="/orders" search={{ view: "crac" }} tone="warning" />
          <Kpi label="Amount received" value={inr(sum(live, (o) => Number(o.amount_received)))} to="/payments" />
          <Kpi label="Total outstanding" value={inr(sum(withBal, outstanding))} to="/orders" search={{ view: "outstanding" }} />
          <Kpi label="Partially paid" value={partial.length} to="/orders" search={{ view: "partial" }} />
          <Kpi label="Fully paid" value={full.length} to="/orders" search={{ view: "paid" }} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Upcoming dispatch deadlines">
            <DataTable head={["GeM order", "Buyer", "Deadline", "Days left", "Status"]}
              rows={awaiting.filter((o) => o.dispatch_deadline! >= t).sort((a, b) => a.dispatch_deadline!.localeCompare(b.dispatch_deadline!)).slice(0, 8)
                .map((o) => orow(o, [fmtDate(o.dispatch_deadline), daysBetween(t, o.dispatch_deadline!), <StatusPill status={st(o)} />]))} />
          </Section>
          <Section title="Overdue dispatches">
            <DataTable head={["GeM order", "Buyer", "Deadline", "Days late"]}
              rows={overdue.sort((a, b) => a.dispatch_deadline!.localeCompare(b.dispatch_deadline!)).map((o) => orow(o, [fmtDate(o.dispatch_deadline), -daysBetween(t, o.dispatch_deadline!)]))} />
          </Section>
          <Section title="Recent GeM orders">
            <DataTable head={["GeM order", "Buyer", "Order date", "Value"]} rows={orders.slice(0, 8).map((o) => orow(o, [fmtDate(o.order_date), inr(o.official_value)]))} />
          </Section>
          <Section title="Recently dispatched">
            <DataTable head={["GeM order", "Buyer", "Dispatched", "Status"]}
              rows={live.filter((o) => o.last_dispatch_date).sort((a, b) => b.last_dispatch_date!.localeCompare(a.last_dispatch_date!)).slice(0, 8).map((o) => orow(o, [fmtDate(o.last_dispatch_date), <StatusPill status={st(o)} />]))} />
          </Section>
          <Section title="Delivered, awaiting CRAC">
            <DataTable head={["GeM order", "Buyer", "Value"]} rows={awaitingCrac.map((o) => orow(o, [inr(o.official_value)]))} />
          </Section>
          <Section title="CRAC generated, payment pending">
            <DataTable head={["GeM order", "Buyer", "Outstanding"]} rows={cracNoPay.map((o) => orow(o, [inr(outstanding(o))]))} />
          </Section>
          <Section title="Partially paid orders">
            <DataTable head={["GeM order", "Buyer", "Received", "Outstanding"]} rows={partial.map((o) => orow(o, [inr(o.amount_received), inr(outstanding(o))]))} />
          </Section>
          <Section title="Orders with outstanding balances">
            <DataTable head={["GeM order", "Buyer", "Order value", "Outstanding"]} rows={withBal.sort((a, b) => outstanding(b) - outstanding(a)).slice(0, 10).map((o) => orow(o, [inr(o.official_value), inr(outstanding(o))]))} />
          </Section>
          <Section title="Recent payment receipts">
            <DataTable head={["Date", "GeM order", "Reference", "Amount"]}
              rows={(payments.data ?? []).map((p) => [fmtDate(p.payment_date), <OrderLink id={p.order_id} label={p.orders?.gem_order_number ?? ""} />, p.transaction_ref, p.reversed ? <s>{inr(p.amount)}</s> : inr(p.amount)])} />
          </Section>
          <Section title="Recent SMS notifications">
            <DataTable head={["Scheduled", "GeM order", "Type", "Status"]}
              rows={(sms.data ?? []).map((s) => [fmtDate(s.scheduled_date), s.orders?.gem_order_number ?? "—", s.kind, <StatusPill status={s.status} />])} />
          </Section>
        </div>
      </>)}
    </div>
  );
}
