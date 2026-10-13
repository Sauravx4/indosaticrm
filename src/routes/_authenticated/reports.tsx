import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders } from "@/lib/session";
import { daysBetween, dispatchStatus, download, fmtDate, inr, outstanding, paymentStage, todayISO, toCSV, toExcel } from "@/lib/crm";
import { PageHeader, Section } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — INDOSATI CRM" }, { name: "description", content: "GeM order, dispatch, CRAC and payment reports." }] }),
  component: Page,
});

const REPORTS = ["Monthly GeM Orders", "Orders by Buyer", "Orders by Product", "Dispatch Performance", "Delayed Dispatches", "CRAC Pending Report", "Payment Received Report", "Outstanding Payment Report", "Buyer-Wise Outstanding Report", "Month-Wise Revenue and Collections", "SMS Reminder Report"] as const;
type Row = Record<string, string | number>;

function Page() {
  const { data: orders = [] } = useOrders();
  const [r, setR] = useState<(typeof REPORTS)[number]>("Monthly GeM Orders");
  const extra = useQuery({
    queryKey: ["report-extra"],
    queryFn: async () => {
      const [items, pays, sms] = await Promise.all([
        supabase.from("order_items").select("product_name, quantity, amount, order_id"),
        supabase.from("payments").select("*, orders(gem_order_number, buyers(name))").eq("reversed", false).order("payment_date"),
        supabase.from("sms_notifications").select("*, orders(gem_order_number)").order("scheduled_date", { ascending: false }),
      ]);
      return { items: items.data ?? [], pays: pays.data ?? [], sms: sms.data ?? [] };
    },
  });
  const t = todayISO();
  const live = orders.filter((o) => !o.cancelled);

  const rows: Row[] = useMemo(() => {
    const group = <T,>(xs: T[], key: (x: T) => string, f: (g: T[]) => Row) => {
      const m = new Map<string, T[]>(); xs.forEach((x) => m.set(key(x), [...(m.get(key(x)) ?? []), x]));
      return [...m.entries()].sort().map(([k, g]) => ({ Key: k, ...f(g) }));
    };
    const e = extra.data;
    switch (r) {
      case "Monthly GeM Orders": return group(live, (o) => o.order_date!.slice(0, 7), (g) => ({ Orders: g.length, "Order value": g.reduce((a, o) => a + Number(o.official_value), 0) }));
      case "Orders by Buyer": return group(live, (o) => o.buyer_name ?? "—", (g) => ({ Orders: g.length, "Order value": g.reduce((a, o) => a + Number(o.official_value), 0) }));
      case "Orders by Product": return group(e?.items ?? [], (i) => i.product_name, (g) => ({ Lines: g.length, Quantity: g.reduce((a, i) => a + Number(i.quantity), 0), Value: g.reduce((a, i) => a + Number(i.amount), 0) }));
      case "Dispatch Performance": return live.filter((o) => o.last_dispatch_date).map((o) => ({ "GeM Order": o.gem_order_number!, Deadline: fmtDate(o.dispatch_deadline), "Last dispatch": fmtDate(o.last_dispatch_date), "Days early(+)/late(-)": daysBetween(o.last_dispatch_date!, o.dispatch_deadline!), Status: dispatchStatus(o) }));
      case "Delayed Dispatches": return live.filter((o) => (o.last_dispatch_date ?? t) > o.dispatch_deadline! && dispatchStatus(o) !== "Delivered" || dispatchStatus(o) === "Dispatch Overdue").map((o) => ({ "GeM Order": o.gem_order_number!, Buyer: o.buyer_name ?? "", Deadline: fmtDate(o.dispatch_deadline), "Days late": daysBetween(o.dispatch_deadline!, o.last_dispatch_date ?? t), Status: dispatchStatus(o) }));
      case "CRAC Pending Report": return live.filter((o) => paymentStage(o) === "CRAC Awaited").map((o) => ({ "GeM Order": o.gem_order_number!, Buyer: o.buyer_name ?? "", Value: Number(o.official_value) }));
      case "Payment Received Report": return (e?.pays ?? []).map((p) => ({ Date: fmtDate(p.payment_date), "GeM Order": p.orders?.gem_order_number ?? "", Buyer: p.orders?.buyers?.name ?? "", Reference: p.transaction_ref, Method: p.method, Amount: Number(p.amount) }));
      case "Outstanding Payment Report": return live.filter((o) => outstanding(o) !== 0).map((o) => ({ "GeM Order": o.gem_order_number!, Buyer: o.buyer_name ?? "", "Order value": Number(o.official_value), Received: Number(o.amount_received), Outstanding: outstanding(o), Stage: paymentStage(o) }));
      case "Buyer-Wise Outstanding Report": return group(live, (o) => o.buyer_name ?? "—", (g) => ({ Orders: g.length, "Order value": g.reduce((a, o) => a + Number(o.official_value), 0), Received: g.reduce((a, o) => a + Number(o.amount_received), 0), Outstanding: g.reduce((a, o) => a + outstanding(o), 0) }));
      case "Month-Wise Revenue and Collections": {
        const m = new Map<string, { Revenue: number; Collections: number }>();
        live.forEach((o) => { const k = o.order_date!.slice(0, 7); const v = m.get(k) ?? { Revenue: 0, Collections: 0 }; v.Revenue += Number(o.official_value); m.set(k, v); });
        (e?.pays ?? []).forEach((p) => { const k = p.payment_date.slice(0, 7); const v = m.get(k) ?? { Revenue: 0, Collections: 0 }; v.Collections += Number(p.amount); m.set(k, v); });
        return [...m.entries()].sort().map(([k, v]) => ({ Month: k, ...v }));
      }
      case "SMS Reminder Report": return (e?.sms ?? []).map((s) => ({ Scheduled: fmtDate(s.scheduled_date), "GeM Order": s.orders?.gem_order_number ?? "", Type: s.kind, Recipient: s.recipient ?? "", Status: s.status, Error: s.error ?? "" }));
    }
  }, [r, live, extra.data, t]);

  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const money = /value|amount|received|outstanding|revenue|collections/i;
  const slug = r.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" actions={<>
        <select value={r} onChange={(e) => setR(e.target.value as never)} className="h-9 rounded-md border bg-card px-2 text-sm">{REPORTS.map((x) => <option key={x}>{x}</option>)}</select>
        <Button variant="outline" onClick={() => download(`${slug}.csv`, toCSV(rows))}>CSV</Button>
        <Button variant="outline" onClick={() => download(`${slug}.xls`, toExcel(rows, r.slice(0, 30)), "application/vnd.ms-excel")}>Excel</Button>
        <Button variant="outline" onClick={() => window.print()}>Print / PDF</Button>
      </>} />
      <Section title={`${r} · ${rows.length} rows`}>
        {rows.length ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c} className="px-4 py-2 font-medium">{c === "Key" ? "Group" : c}</th>)}</tr></thead>
            <tbody>{rows.map((row, i) => <tr key={i} className="border-t">{cols.map((c) => <td key={c} className="px-4 py-2">{typeof row[c] === "number" && money.test(c) ? inr(row[c] as number) : row[c]}</td>)}</tr>)}</tbody>
          </table>
        ) : <div className="p-8 text-center text-sm text-muted-foreground">No data for this report yet.</div>}
      </Section>
    </div>
  );
}
