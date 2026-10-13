import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders } from "@/lib/session";
import { daysBetween, dispatchStatus, download, fmtDate, inr, outstanding, paymentStage, todayISO, toCSV, DISPATCH_STATUSES, PAYMENT_STAGES } from "@/lib/crm";
import { DataTable, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";

type Search = { q?: string | undefined; view?: string | undefined };

export const Route = createFileRoute("/_authenticated/orders/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: (s["q"] as string) || undefined, view: (s["view"] as string) || undefined }),
  head: () => ({ meta: [{ title: "GeM Orders — INDOSATI CRM" }, { name: "description", content: "All GeM orders with search and filters." }] }),
  component: Orders,
});

const PAGE = 25;

function Orders() {
  const search = Route.useSearch();
  const { data: orders = [], isLoading } = useOrders();
  const [q, setQ] = useState(search.q ?? "");
  const [ds, setDs] = useState("");
  const [ps, setPs] = useState("");
  const [state, setState] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minBal, setMinBal] = useState("");
  const [page, setPage] = useState(0);
  const view = search.view;

  // Related references for global search (invoice, docket, CRAC, payment refs)
  const refs = useQuery({
    queryKey: ["search-refs"],
    queryFn: async () => {
      const [d, c, p] = await Promise.all([
        supabase.from("dispatches").select("order_id, invoice_number, docket_number, lr_number, transporter"),
        supabase.from("crac_records").select("order_id, crac_number"),
        supabase.from("payments").select("order_id, transaction_ref, bank_ref"),
      ]);
      const m = new Map<string, string>();
      for (const r of [...(d.data ?? []), ...(c.data ?? []), ...(p.data ?? [])]) {
        m.set(r.order_id, (m.get(r.order_id) ?? "") + " " + Object.values(r).join(" "));
      }
      return m;
    },
  });

  const t = todayISO();
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      const dst = dispatchStatus(o);
      const pst = paymentStage(o);
      if (needle) {
        const hay = [o.gem_order_number, o.crm_id, o.contract_ref, o.buyer_name, o.buyer_mobile, o.products, refs.data?.get(o.id!)].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (ds && dst !== ds) return false;
      if (ps && pst !== ps) return false;
      if (state && (o.buyer_state ?? "") !== state) return false;
      if (from && o.order_date! < from) return false;
      if (to && o.order_date! > to) return false;
      if (minBal && outstanding(o) < Number(minBal)) return false;
      switch (view) {
        case "month": return o.order_date!.slice(0, 7) === t.slice(0, 7);
        case "awaiting": return ["Pending Dispatch", "Dispatch Due Soon", "Dispatch Overdue", "Partially Dispatched"].includes(dst);
        case "duesoon": { const d = daysBetween(t, o.dispatch_deadline!); return !o.cancelled && d >= 0 && d <= 5 && !["Fully Dispatched", "Delivered"].includes(dst); }
        case "overdue": return dst === "Dispatch Overdue" || (dst === "Partially Dispatched" && o.dispatch_deadline! < t);
        case "crac": return pst === "CRAC Awaited";
        case "outstanding": return !o.cancelled && outstanding(o) > 0;
        case "partial": return pst === "Part Payment Received";
        case "paid": return pst === "Full Payment Received";
      }
      return true;
    });
  }, [orders, q, ds, ps, state, from, to, minBal, view, refs.data, t]);

  const states = [...new Set(orders.map((o) => o.buyer_state).filter(Boolean))] as string[];
  const rowsForExport = filtered.map((o) => ({
    "CRM ID": o.crm_id, "GeM Order No": o.gem_order_number, Buyer: o.buyer_name, State: o.buyer_state, Products: o.products,
    "Order Date": fmtDate(o.order_date), "Dispatch Deadline": fmtDate(o.dispatch_deadline), "Dispatch Status": dispatchStatus(o),
    "Payment Stage": paymentStage(o), "Order Value": Number(o.official_value), Received: Number(o.amount_received), Outstanding: outstanding(o),
  }));
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const sel = "h-9 rounded-md border bg-card px-2 text-sm";

  return (
    <div>
      <PageHeader title="GeM Orders" subtitle={`${filtered.length} of ${orders.length} orders${view ? ` · filter: ${view}` : ""}`}
        actions={<>
          {view && <Button variant="outline" asChild><Link to="/orders">Clear filter</Link></Button>}
          <Button variant="outline" onClick={() => download("gem-orders.csv", toCSV(rowsForExport))}>Export CSV</Button>
          <Button asChild><Link to="/orders/new">Add order</Link></Button>
        </>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search…" className={sel + " w-64"} />
        <select value={ds} onChange={(e) => setDs(e.target.value)} className={sel}><option value="">All dispatch statuses</option>{DISPATCH_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={ps} onChange={(e) => setPs(e.target.value)} className={sel}><option value="">All payment stages</option>{PAYMENT_STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={state} onChange={(e) => setState(e.target.value)} className={sel}><option value="">All states</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} title="Order date from" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={sel} title="Order date to" />
        <input type="number" value={minBal} onChange={(e) => setMinBal(e.target.value)} placeholder="Min outstanding ₹" className={sel + " w-40"} />
      </div>
      <Section title="Orders">
        {isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          <DataTable head={["CRM ID", "GeM order", "Buyer", "Order date", "Deadline", "Dispatch", "Payment", "Value", "Outstanding"]}
            rows={pageRows.map((o) => [o.crm_id, <OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—",
              fmtDate(o.order_date), fmtDate(o.dispatch_deadline), <StatusPill status={dispatchStatus(o)} />, <StatusPill status={paymentStage(o)} />,
              inr(o.official_value), <span className={outstanding(o) < 0 ? "text-destructive" : ""}>{inr(outstanding(o))}</span>])} />}
        {filtered.length > PAGE && (
          <div className="flex items-center justify-end gap-2 border-t p-3 text-sm">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page + 1} of {Math.ceil(filtered.length / PAGE)}</span>
            <Button size="sm" variant="outline" disabled={(page + 1) * PAGE >= filtered.length} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </Section>
    </div>
  );
}
