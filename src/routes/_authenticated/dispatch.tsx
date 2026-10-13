import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useOrders } from "@/lib/session";
import { daysBetween, dispatchStatus, DISPATCH_STATUSES, fmtDate, todayISO } from "@/lib/crm";
import { DataTable, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";

export const Route = createFileRoute("/_authenticated/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch Management — INDOSATI CRM" }, { name: "description", content: "Dispatch deadlines and shipment status." }] }),
  component: Page,
});

function Page() {
  const { data = [] } = useOrders();
  const [f, setF] = useState("open");
  const t = todayISO();
  const rows = data.filter((o) => {
    const s = dispatchStatus(o);
    if (f === "open") return ["Pending Dispatch", "Dispatch Due Soon", "Dispatch Overdue", "Partially Dispatched"].includes(s);
    return f === "" || s === f;
  }).sort((a, b) => a.dispatch_deadline!.localeCompare(b.dispatch_deadline!));
  return (
    <div>
      <PageHeader title="Dispatch Management" subtitle="Open an order to record a full or partial dispatch." actions={
        <select value={f} onChange={(e) => setF(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm">
          <option value="open">Open (not fully dispatched)</option><option value="">All</option>{DISPATCH_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>} />
      <Section title={`${rows.length} orders`}>
        <DataTable head={["GeM order", "Buyer", "Deadline", "Days left", "Qty dispatched", "Shipments", "Status"]}
          rows={rows.map((o) => [<OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—", fmtDate(o.dispatch_deadline), daysBetween(t, o.dispatch_deadline!),
            `${o.dispatched_qty} / ${o.total_qty}`, o.dispatch_count, <StatusPill status={dispatchStatus(o)} />])} />
      </Section>
    </div>
  );
}
