import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useProfiles } from "@/lib/session";
import { addDays, inr, todayISO } from "@/lib/crm";
import { Field, PageHeader } from "@/components/crm/ui";
import { BuyerFields, cleanBuyer, emptyBuyer } from "@/components/crm/BuyerForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/orders/new")({
  head: () => ({ meta: [{ title: "Add New Order — INDOSATI CRM" }, { name: "description", content: "Record a new GeM order." }] }),
  component: NewOrder,
});

type Item = { product_name: string; sku: string; description: string; quantity: string; uom: string; unit_price: string; tax_pct: string };
const blankItem: Item = { product_name: "", sku: "", description: "", quantity: "1", uom: "Nos", unit_price: "", tax_pct: "18" };
const lineAmt = (i: Item) => Math.round(Number(i.quantity || 0) * Number(i.unit_price || 0) * (1 + Number(i.tax_pct || 0) / 100) * 100) / 100;

function NewOrder() {
  const { data: me } = useMe();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const buyers = useQuery({ queryKey: ["buyers"], queryFn: async () => (await supabase.from("buyers").select("*").order("name")).data ?? [] });
  const [o, setO] = useState({ gem_order_number: "", contract_ref: "", order_date: todayISO(), dispatch_deadline: "", assigned_to: "", additional_charges: "0", official_value: "", remarks: "" });
  const [buyerId, setBuyerId] = useState("");
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [items, setItems] = useState<Item[]>([{ ...blankItem }]);
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);

  const computed = items.reduce((a, i) => a + lineAmt(i), 0) + Number(o.additional_charges || 0);
  const official = override ? Number(o.official_value || 0) : computed;
  const reminder = o.dispatch_deadline ? addDays(o.dispatch_deadline, -5) : "";
  const reminderPast = reminder && reminder < todayISO();

  if (me && !me.canOrders) return <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">You don't have permission to add orders.</div>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (o.dispatch_deadline < o.order_date) return void toast.error("Dispatch deadline cannot be before the order date.");
    if (!items.some((i) => i.product_name.trim())) return void toast.error("Add at least one product.");
    setBusy(true);
    try {
      let bid = buyerId;
      if (!bid) {
        const { data, error } = await supabase.from("buyers").insert(cleanBuyer(buyer)).select("id").single();
        if (error) throw error;
        bid = data.id;
      }
      const { data: ord, error } = await supabase.from("orders").insert({
        gem_order_number: o.gem_order_number.trim(), contract_ref: o.contract_ref || null, order_date: o.order_date,
        dispatch_deadline: o.dispatch_deadline, buyer_id: bid, assigned_to: o.assigned_to || null,
        additional_charges: Number(o.additional_charges || 0), official_value: official, remarks: o.remarks || null, created_by: me?.user.id ?? null,
      }).select("id").single();
      if (error) throw error.code === "23505" ? new Error("This GeM order number already exists.") : error;
      const { error: ie } = await supabase.from("order_items").insert(items.filter((i) => i.product_name.trim()).map((i) => ({
        order_id: ord.id, product_name: i.product_name, sku: i.sku || null, description: i.description || null,
        quantity: Number(i.quantity), uom: i.uom, unit_price: Number(i.unit_price || 0), tax_pct: Number(i.tax_pct || 0),
      })));
      if (ie) throw ie;
      await qc.invalidateQueries();
      toast.success("Order saved.");
      if (reminderPast) toast.warning("The 5-day reminder date has already passed — this order needs immediate attention.");
      navigate({ to: "/orders/$id", params: { id: ord.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  const setItem = (i: number, patch: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const card = "rounded-lg border bg-card p-5 space-y-4";

  return (
    <form onSubmit={save} className="space-y-6">
      <PageHeader title="Add New Order" subtitle="Dispatch, CRAC and payments can be added later from the order page." />
      <section className={card}>
        <h2 className="font-semibold">1. Order details</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="GeM order number" required><Input required value={o.gem_order_number} onChange={(e) => setO({ ...o, gem_order_number: e.target.value })} placeholder="GEMC-5116877…" /></Field>
          <Field label="Contract / PO reference"><Input value={o.contract_ref} onChange={(e) => setO({ ...o, contract_ref: e.target.value })} /></Field>
          <Field label="Assigned employee">
            <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={o.assigned_to} onChange={(e) => setO({ ...o, assigned_to: e.target.value })}>
              <option value="">— Select —</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </select>
          </Field>
          <Field label="Order generation date" required><Input type="date" required value={o.order_date} onChange={(e) => setO({ ...o, order_date: e.target.value })} /></Field>
          <Field label="Last date for dispatch" required><Input type="date" required value={o.dispatch_deadline} onChange={(e) => setO({ ...o, dispatch_deadline: e.target.value })} /></Field>
          <Field label="SMS reminder date (5 days before)">
            <div className={`flex h-9 items-center rounded-md border px-3 text-sm ${reminderPast ? "border-destructive text-destructive" : "bg-muted"}`}>
              {reminder ? reminder.split("-").reverse().join("-") : "—"}{reminderPast && " · already passed"}
            </div>
          </Field>
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">2. Buyer details</h2>
          <select className="h-9 rounded-md border bg-card px-2 text-sm" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            <option value="">+ New buyer</option>{(buyers.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ""}</option>)}
          </select>
        </div>
        {buyerId ? <p className="text-sm text-muted-foreground">Using saved buyer from the directory.</p> : <BuyerFields value={buyer} onChange={setBuyer} />}
      </section>

      <section className={card}>
        <h2 className="font-semibold">3. Product details</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr>{["Product", "SKU", "Description", "Qty", "Unit", "Unit price ₹", "Tax %", "Amount", ""].map((h) => <th key={h} className="px-1 py-1 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="p-1"><Input value={it.product_name} onChange={(e) => setItem(i, { product_name: e.target.value })} /></td>
                  <td className="p-1 w-28"><Input value={it.sku} onChange={(e) => setItem(i, { sku: e.target.value })} /></td>
                  <td className="p-1"><Input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} /></td>
                  <td className="p-1 w-20"><Input type="number" min="0" step="any" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} /></td>
                  <td className="p-1 w-20"><Input value={it.uom} onChange={(e) => setItem(i, { uom: e.target.value })} /></td>
                  <td className="p-1 w-28"><Input type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: e.target.value })} /></td>
                  <td className="p-1 w-20"><Input type="number" min="0" step="0.01" value={it.tax_pct} onChange={(e) => setItem(i, { tax_pct: e.target.value })} /></td>
                  <td className="p-1 w-32 text-right">{inr(lineAmt(it))}</td>
                  <td className="p-1"><Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { ...blankItem }])}><Plus className="mr-1 h-4 w-4" />Add product</Button>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Additional charges ₹"><Input type="number" step="0.01" value={o.additional_charges} onChange={(e) => setO({ ...o, additional_charges: e.target.value })} /></Field>
          <Field label="Calculated total"><div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">{inr(computed)}</div></Field>
          <Field label="Official GeM order value ₹ (used for balances)">
            <div className="flex gap-2">
              <Input type="number" step="0.01" disabled={!override} value={override ? o.official_value : computed.toFixed(2)} onChange={(e) => setO({ ...o, official_value: e.target.value })} />
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => { setOverride(!override); setO({ ...o, official_value: computed.toFixed(2) }); }}>{override ? "Use calc." : "Override"}</Button>
            </div>
          </Field>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">4–7. Dispatch, CRAC, payments, attachments</h2>
        <p className="text-sm text-muted-foreground">Once saved, the order page lets you record shipments, delivery, CRAC, payments and upload the PO and other documents.</p>
        <Field label="Remarks / internal notes"><Textarea value={o.remarks} onChange={(e) => setO({ ...o, remarks: e.target.value })} /></Field>
      </section>
      <div className="flex justify-end"><Button disabled={busy} size="lg">{busy ? "Saving…" : "Save order"}</Button></div>
    </form>
  );
}
