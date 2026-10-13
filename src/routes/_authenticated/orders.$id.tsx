import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { addDays, dispatchStatus, fmtDate, inr, netReceivable, outstanding, paymentStage, todayISO } from "@/lib/crm";
import { DataTable, Field, PageHeader, Section, StatusPill } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order — INDOSATI CRM" }, { name: "description", content: "GeM order detail." }] }),
  component: OrderPage,
});

export const CRAC_STATUSES = ["Dispatch Not Completed", "Awaiting Buyer Receipt", "Delivered — CRAC Pending", "CRAC Generated", "CRAC Issue or Clarification Required"];
export const DELIVERY_STATUSES = ["In Transit", "Out for Delivery", "Delivered", "Delivery Issue", "Returned"];
const METHODS = ["Bank Transfer", "NEFT", "RTGS", "IMPS", "Other"];

function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const [o, items, disp, crac, pays, adj, att, buyer] = await Promise.all([
        supabase.from("order_summary").select("*").eq("id", id).single(),
        supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
        supabase.from("dispatches").select("*, dispatch_items(*)").eq("order_id", id).order("dispatch_date"),
        supabase.from("crac_records").select("*").eq("order_id", id).order("created_at"),
        supabase.from("payments").select("*").eq("order_id", id).order("payment_date"),
        supabase.from("adjustments").select("*").eq("order_id", id).order("adj_date"),
        supabase.from("attachments").select("*").eq("order_id", id).order("created_at"),
        supabase.from("orders").select("buyers(*)").eq("id", id).single(),
      ]);
      if (o.error) throw o.error;
      return { o: o.data, items: items.data ?? [], disp: disp.data ?? [], crac: crac.data ?? [], pays: pays.data ?? [], adj: adj.data ?? [], att: att.data ?? [], buyer: buyer.data?.buyers };
    },
  });
}

function Form({ children, onSubmit, onCancel, busy }: { children: ReactNode; onSubmit: () => Promise<void>; onCancel: () => void; busy?: boolean }) {
  const [b, setB] = useState(false);
  return (
    <form className="space-y-3 border-t bg-muted/30 p-4" onSubmit={async (e) => { e.preventDefault(); setB(true); try { await onSubmit(); } catch (err) { toast.error((err as Error).message); } finally { setB(false); } }}>
      <div className="grid gap-3 md:grid-cols-4">{children}</div>
      <div className="flex gap-2"><Button size="sm" disabled={b || busy}>{b ? "Saving…" : "Save"}</Button><Button size="sm" type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </form>
  );
}

function useForm<T extends Record<string, string>>(init: T) {
  const [v, setV] = useState(init);
  const bind = (k: keyof T, type = "text", extra: Record<string, unknown> = {}) => ({ type, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }), ...extra });
  return { v, setV, bind, reset: () => setV(init) };
}
const nz = (s: string) => (s.trim() === "" ? null : s.trim());
const sel = "h-9 w-full rounded-md border bg-card px-2 text-sm";

function OrderPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useOrder(id);
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries(); setOpen(null); };

  const dForm = useForm({ dispatch_date: todayISO(), transporter: "", transport_mode: "Road", docket_number: "", lr_number: "", vehicle_number: "", eway_bill: "", invoice_number: "", invoice_date: "", invoice_amount: "", expected_delivery: "", remarks: "" });
  const [dQty, setDQty] = useState<Record<string, string>>({});
  const cForm = useForm({ dispatch_id: "", invoice_number: "", status: "Delivered — CRAC Pending", crac_number: "", crac_date: "", crac_amount: "", follow_up_date: "", remarks: "" });
  const pForm = useForm({ transaction_ref: "", payment_date: todayISO(), amount: "", method: "NEFT", invoice_ref: "", crac_ref: "", bank_ref: "", remarks: "" });
  const aForm = useForm({ kind: "Deduction", amount: "", adj_date: todayISO(), remarks: "" });
  const eForm = useForm({ dispatch_deadline: "", official_value: "", remarks: "" });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error || !data) return <div className="text-sm text-destructive">Order not found.</div>;
  const { o, items, disp, crac, pays, adj, att, buyer } = data;

  const sentQty = (itemId: string) => disp.flatMap((d) => d.dispatch_items).filter((x) => x.order_item_id === itemId).reduce((a, x) => a + Number(x.quantity), 0);
  const out = outstanding(o);
  const can = me?.canOrders, canPay = me?.canPayments;

  async function addDispatch() {
    const lines = items.map((i) => ({ order_item_id: i.id, quantity: Number(dQty[i.id] || 0) })).filter((l) => l.quantity > 0);
    if (!lines.length) throw new Error("Enter the quantity dispatched for at least one product.");
    for (const l of lines) { const it = items.find((i) => i.id === l.order_item_id)!; if (l.quantity > Number(it.quantity) - sentQty(it.id)) throw new Error(`Quantity for ${it.product_name} is more than what is pending.`); }
    const v = dForm.v;
    const { data: d, error } = await supabase.from("dispatches").insert({
      order_id: id, dispatch_date: v.dispatch_date, transporter: nz(v.transporter), transport_mode: nz(v.transport_mode), docket_number: nz(v.docket_number),
      lr_number: nz(v.lr_number), vehicle_number: nz(v.vehicle_number), eway_bill: nz(v.eway_bill), invoice_number: nz(v.invoice_number),
      invoice_date: nz(v.invoice_date), invoice_amount: v.invoice_amount ? Number(v.invoice_amount) : null, expected_delivery: nz(v.expected_delivery), remarks: nz(v.remarks),
    }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await supabase.from("dispatch_items").insert(lines.map((l) => ({ ...l, dispatch_id: d.id })));
    if (e2) throw e2;
    toast.success("Dispatch recorded."); dForm.reset(); setDQty({}); refresh();
  }
  async function updateDelivery(did: string, patch: Record<string, string | null>) {
    const { error } = await supabase.from("dispatches").update(patch).eq("id", did);
    if (error) return toast.error(error.message);
    toast.success("Delivery updated."); refresh();
  }
  async function addCrac() {
    const v = cForm.v;
    if (v.status === "CRAC Generated" && (!v.crac_number || !v.crac_date)) throw new Error("CRAC number and generation date are required for a generated CRAC.");
    const { error } = await supabase.from("crac_records").insert({ order_id: id, dispatch_id: nz(v.dispatch_id), invoice_number: nz(v.invoice_number), status: v.status, crac_number: nz(v.crac_number), crac_date: nz(v.crac_date), crac_amount: v.crac_amount ? Number(v.crac_amount) : null, follow_up_date: nz(v.follow_up_date), remarks: nz(v.remarks) });
    if (error) throw error;
    toast.success("CRAC record saved."); cForm.reset(); refresh();
  }
  async function updateCrac(cid: string, status: string) {
    const c = crac.find((x) => x.id === cid)!;
    let patch: Record<string, string> = { status };
    if (status === "CRAC Generated" && (!c.crac_number || !c.crac_date)) {
      const num = prompt("CRAC reference number?"); const dt = prompt("CRAC generation date (YYYY-MM-DD)?");
      if (!num || !dt || !/^\d{4}-\d{2}-\d{2}$/.test(dt)) return toast.error("CRAC number and a valid date are required.");
      patch = { ...patch, crac_number: num, crac_date: dt };
    }
    const { error } = await supabase.from("crac_records").update(patch).eq("id", cid);
    if (error) return toast.error(error.message);
    toast.success("CRAC updated."); refresh();
  }
  async function addPayment() {
    const v = pForm.v;
    const { error } = await supabase.from("payments").insert({ order_id: id, transaction_ref: v.transaction_ref.trim(), payment_date: v.payment_date, amount: Number(v.amount), method: v.method, invoice_ref: nz(v.invoice_ref), crac_ref: nz(v.crac_ref), bank_ref: nz(v.bank_ref), remarks: nz(v.remarks), created_by: me?.user.id });
    if (error) throw error.code === "23505" ? new Error("A payment with this transaction reference already exists.") : error;
    toast.success("Payment recorded."); pForm.reset(); refresh();
  }
  async function reversePayment(pid: string) {
    const reason = prompt("Reason for reversing this payment?");
    if (!reason) return;
    const { error } = await supabase.from("payments").update({ reversed: true, reversed_reason: reason }).eq("id", pid);
    if (error) return toast.error(error.message);
    toast.success("Payment reversed."); refresh();
  }
  async function addAdj() {
    const v = aForm.v;
    const amt = Math.abs(Number(v.amount)) * (v.kind === "Addition" ? 1 : -1);
    const { error } = await supabase.from("adjustments").insert({ order_id: id, kind: v.kind, amount: amt, adj_date: v.adj_date, remarks: nz(v.remarks) });
    if (error) throw error;
    toast.success("Adjustment saved."); aForm.reset(); refresh();
  }
  async function saveEdit() {
    const v = eForm.v;
    const { error } = await supabase.from("orders").update({ dispatch_deadline: v.dispatch_deadline, official_value: Number(v.official_value), remarks: nz(v.remarks) }).eq("id", id);
    if (error) throw error;
    toast.success("Order updated."); refresh();
  }
  async function toggleCancel() {
    if (!confirm(o.cancelled ? "Restore this order?" : "Cancel this order? Dispatch reminders will stop.")) return;
    const { error } = await supabase.from("orders").update({ cancelled: !o.cancelled }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function upload(file: File, category: string) {
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("attachments").insert({ order_id: id, category, file_path: path, file_name: file.name, uploaded_by: me?.user.id });
    if (e2) return toast.error(e2.message);
    toast.success("File uploaded."); refresh();
  }
  async function openFile(path: string) {
    const { data: s, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(s.signedUrl, "_blank");
  }

  const reminder = addDays(o.dispatch_deadline!, -5);
  return (
    <div className="space-y-6">
      <PageHeader title={o.gem_order_number!} subtitle={`${o.crm_id} · ${o.buyer_name ?? ""} · Ordered ${fmtDate(o.order_date)}`}
        actions={<>
          <StatusPill status={dispatchStatus(o)} /><StatusPill status={paymentStage(o)} />
          {can && <Button variant="outline" size="sm" onClick={() => { eForm.setV({ dispatch_deadline: o.dispatch_deadline!, official_value: String(o.official_value), remarks: o.remarks ?? "" }); setOpen("edit"); }}>Edit</Button>}
          {can && <Button variant="outline" size="sm" onClick={toggleCancel}>{o.cancelled ? "Restore" : "Cancel order"}</Button>}
          <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
        </>} />

      <div className="grid gap-3 md:grid-cols-4">
        {[["Official GeM order value", inr(o.official_value)], ["Net receivable (after adjustments)", inr(netReceivable(o))], ["Total amount received", inr(o.amount_received)], [out < 0 ? "Overpaid — reconcile" : "Outstanding balance", inr(Math.abs(out))]].map(([l, v], i) => (
          <div key={l} className={`rounded-lg border bg-card p-4 ${i === 3 && out < 0 ? "border-destructive" : ""}`}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className={`mt-1 font-display text-xl font-semibold ${i === 3 && out < 0 ? "text-destructive" : ""}`}>{v}</div>
          </div>
        ))}
      </div>

      {open === "edit" && (
        <Section title="Edit order">
          <Form onSubmit={saveEdit} onCancel={() => setOpen(null)}>
            <Field label="Last date for dispatch"><Input {...eForm.bind("dispatch_deadline", "date")} required /></Field>
            <Field label="Official GeM order value ₹"><Input {...eForm.bind("official_value", "number", { step: "0.01" })} required /></Field>
            <Field label="Remarks"><Input {...eForm.bind("remarks")} /></Field>
          </Form>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Order & deadline">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm">
            {[["Contract ref", o.contract_ref], ["Dispatch deadline", fmtDate(o.dispatch_deadline)], ["SMS reminder date", fmtDate(reminder)], ["Items value", inr(o.items_value)], ["Created", fmtDate(o.created_at)], ["Last updated", fmtDate(o.updated_at)], ["Remarks", o.remarks]].map(([k, v]) => (
              <div key={k as string} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v || "—"}</dd></div>
            ))}
          </dl>
        </Section>
        <Section title="Buyer">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 text-sm">
            {buyer && [["Name", buyer.name], ["Department", buyer.department], ["Contact", buyer.contact_person], ["Mobile", buyer.mobile], ["Email", buyer.email], ["Delivery address", [buyer.delivery_address, buyer.city, buyer.district, buyer.state, buyer.pin_code].filter(Boolean).join(", ")]].map(([k, v]) => (
              <div key={k as string} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>
            ))}
          </dl>
        </Section>
        <Section title="Attachments" action={can || canPay ? (
          <label className="cursor-pointer text-xs font-medium text-primary">
            Upload<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, prompt("Category (PO, GeM document, Invoice, Proof of dispatch, Transport receipt, POD, CRAC, Bank advice, Other)?", "PO") || "Other"); e.target.value = ""; }} />
          </label>) : undefined}>
          <ul className="divide-y text-sm">
            {att.length ? att.map((a) => (
              <li key={a.id} className="flex justify-between px-4 py-2"><button className="truncate text-primary hover:underline" onClick={() => openFile(a.file_path)}>{a.file_name}</button><span className="text-xs text-muted-foreground">{a.category}</span></li>
            )) : <li className="px-4 py-6 text-center text-muted-foreground">No files yet.</li>}
          </ul>
        </Section>
      </div>

      <Section title="Products">
        <DataTable head={["Product", "SKU", "Qty", "Unit price", "Tax %", "Amount", "Dispatched", "Pending"]}
          rows={items.map((i) => [i.product_name, i.sku ?? "—", `${i.quantity} ${i.uom ?? ""}`, inr(i.unit_price), i.tax_pct, inr(i.amount), sentQty(i.id), Number(i.quantity) - sentQty(i.id)])} />
      </Section>

      <Section title="Dispatches & delivery" action={can && !o.cancelled ? <Button size="sm" variant="outline" onClick={() => setOpen("disp")}>Record dispatch</Button> : undefined}>
        {open === "disp" && (
          <Form onSubmit={addDispatch} onCancel={() => setOpen(null)}>
            {items.map((i) => (
              <Field key={i.id} label={`Qty: ${i.product_name} (pending ${Number(i.quantity) - sentQty(i.id)})`}>
                <Input type="number" min="0" step="any" value={dQty[i.id] ?? ""} onChange={(e) => setDQty({ ...dQty, [i.id]: e.target.value })} />
              </Field>
            ))}
            <Field label="Dispatch date" required><Input {...dForm.bind("dispatch_date", "date")} required /></Field>
            <Field label="Transporter / courier"><Input {...dForm.bind("transporter")} /></Field>
            <Field label="Mode"><Input {...dForm.bind("transport_mode")} /></Field>
            <Field label="Docket / consignment no."><Input {...dForm.bind("docket_number")} /></Field>
            <Field label="LR / GR no."><Input {...dForm.bind("lr_number")} /></Field>
            <Field label="Vehicle no."><Input {...dForm.bind("vehicle_number")} /></Field>
            <Field label="E-way bill no."><Input {...dForm.bind("eway_bill")} /></Field>
            <Field label="Invoice no."><Input {...dForm.bind("invoice_number")} /></Field>
            <Field label="Invoice date"><Input {...dForm.bind("invoice_date", "date")} /></Field>
            <Field label="Invoice amount ₹"><Input {...dForm.bind("invoice_amount", "number", { step: "0.01" })} /></Field>
            <Field label="Expected delivery"><Input {...dForm.bind("expected_delivery", "date")} /></Field>
            <Field label="Remarks"><Input {...dForm.bind("remarks")} /></Field>
          </Form>
        )}
        <DataTable head={["Dispatched", "Transporter", "Docket", "Invoice", "Amount", "Expected", "Buyer received", "Delivery"]}
          rows={disp.map((d) => [fmtDate(d.dispatch_date), d.transporter ?? "—", d.docket_number ?? "—", d.invoice_number ? `${d.invoice_number} (${fmtDate(d.invoice_date)})` : "—", inr(d.invoice_amount), fmtDate(d.expected_delivery),
            can ? <input type="date" className="rounded border bg-card px-1 text-xs" defaultValue={d.buyer_received_date ?? ""} onBlur={(e) => e.target.value !== (d.buyer_received_date ?? "") && updateDelivery(d.id, { buyer_received_date: e.target.value || null, actual_delivery: e.target.value || null, delivery_status: e.target.value ? "Delivered" : d.delivery_status })} /> : fmtDate(d.buyer_received_date),
            can ? <select className="rounded border bg-card px-1 text-xs" value={d.delivery_status} onChange={(e) => updateDelivery(d.id, { delivery_status: e.target.value })}>{DELIVERY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select> : <StatusPill status={d.delivery_status} />])} />
      </Section>

      <Section title="CRAC" action={can ? <Button size="sm" variant="outline" onClick={() => setOpen("crac")}>Add CRAC record</Button> : undefined}>
        {open === "crac" && (
          <Form onSubmit={addCrac} onCancel={() => setOpen(null)}>
            <Field label="Shipment"><select className={sel} value={cForm.v.dispatch_id} onChange={(e) => { const d = disp.find((x) => x.id === e.target.value); cForm.setV({ ...cForm.v, dispatch_id: e.target.value, invoice_number: d?.invoice_number ?? cForm.v.invoice_number }); }}><option value="">Whole order</option>{disp.map((d) => <option key={d.id} value={d.id}>{fmtDate(d.dispatch_date)} · {d.invoice_number ?? d.docket_number ?? "shipment"}</option>)}</select></Field>
            <Field label="Invoice no."><Input {...cForm.bind("invoice_number")} /></Field>
            <Field label="Status"><select className={sel} value={cForm.v.status} onChange={(e) => cForm.setV({ ...cForm.v, status: e.target.value })}>{CRAC_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="CRAC reference no."><Input {...cForm.bind("crac_number")} /></Field>
            <Field label="CRAC generation date"><Input {...cForm.bind("crac_date", "date")} /></Field>
            <Field label="CRAC amount ₹"><Input {...cForm.bind("crac_amount", "number", { step: "0.01" })} /></Field>
            <Field label="Follow-up date"><Input {...cForm.bind("follow_up_date", "date")} /></Field>
            <Field label="Remarks"><Input {...cForm.bind("remarks")} /></Field>
          </Form>
        )}
        <DataTable head={["Invoice", "CRAC no.", "CRAC date", "Amount", "Follow-up", "Status"]}
          rows={crac.map((c) => [c.invoice_number ?? "—", c.crac_number ?? "—", fmtDate(c.crac_date), inr(c.crac_amount), fmtDate(c.follow_up_date),
            can ? <select className="rounded border bg-card px-1 text-xs" value={c.status} onChange={(e) => updateCrac(c.id, e.target.value)}>{CRAC_STATUSES.map((s) => <option key={s}>{s}</option>)}</select> : <StatusPill status={c.status} />])} />
      </Section>

      <Section title="Payments received" action={canPay ? <Button size="sm" variant="outline" onClick={() => setOpen("pay")}>Record payment</Button> : undefined}>
        {open === "pay" && (
          <Form onSubmit={addPayment} onCancel={() => setOpen(null)}>
            <Field label="Transaction ID / UTR" required><Input {...pForm.bind("transaction_ref")} required /></Field>
            <Field label="Received date" required><Input {...pForm.bind("payment_date", "date")} required /></Field>
            <Field label="Amount ₹" required><Input {...pForm.bind("amount", "number", { step: "0.01", min: "0.01" })} required /></Field>
            <Field label="Method"><select className={sel} value={pForm.v.method} onChange={(e) => pForm.setV({ ...pForm.v, method: e.target.value })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Invoice ref"><Input {...pForm.bind("invoice_ref")} /></Field>
            <Field label="CRAC ref"><Input {...pForm.bind("crac_ref")} /></Field>
            <Field label="Bank / account ref"><Input {...pForm.bind("bank_ref")} /></Field>
            <Field label="Remarks"><Input {...pForm.bind("remarks")} /></Field>
          </Form>
        )}
        <DataTable head={["Date", "Reference", "Method", "Invoice", "Amount", ""]}
          rows={pays.map((p) => [fmtDate(p.payment_date), p.transaction_ref, p.method, p.invoice_ref ?? "—",
            p.reversed ? <span title={p.reversed_reason ?? ""}><s>{inr(p.amount)}</s> <span className="text-xs text-destructive">reversed</span></span> : inr(p.amount),
            canPay && !p.reversed ? <button className="text-xs text-destructive hover:underline" onClick={() => reversePayment(p.id)}>Reverse</button> : ""])} />
      </Section>

      <Section title="Adjustments (credit notes, deductions)" action={canPay ? <Button size="sm" variant="outline" onClick={() => setOpen("adj")}>Add adjustment</Button> : undefined}>
        {open === "adj" && (
          <Form onSubmit={addAdj} onCancel={() => setOpen(null)}>
            <Field label="Type"><select className={sel} value={aForm.v.kind} onChange={(e) => aForm.setV({ ...aForm.v, kind: e.target.value })}>{["Deduction", "Credit note", "Penalty / LD", "Cancellation", "Addition"].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Amount ₹" required><Input {...aForm.bind("amount", "number", { step: "0.01", min: "0.01" })} required /></Field>
            <Field label="Date"><Input {...aForm.bind("adj_date", "date")} /></Field>
            <Field label="Remarks"><Input {...aForm.bind("remarks")} /></Field>
          </Form>
        )}
        <DataTable head={["Date", "Type", "Amount", "Remarks"]} rows={adj.map((a) => [fmtDate(a.adj_date), a.kind, inr(a.amount), a.remarks ?? "—"])} />
      </Section>
      {me?.isAdmin && <History id={id} />}
    </div>
  );
}

function History({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["audit", id], queryFn: async () => (await supabase.from("audit_logs").select("*").or(`record_id.eq.${id},new_data->>order_id.eq.${id},old_data->>order_id.eq.${id}`).order("created_at", { ascending: false }).limit(50)).data ?? [] });
  return (
    <Section title="Change history">
      <DataTable head={["When", "Record", "Action"]} rows={(q.data ?? []).map((a) => [new Date(a.created_at).toLocaleString("en-IN"), a.table_name, a.action])} />
    </Section>
  );
}
