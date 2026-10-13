import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { DataTable, PageHeader, Section } from "@/components/crm/ui";
import { BuyerFields, cleanBuyer, emptyBuyer, type BuyerDraft } from "@/components/crm/BuyerForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/buyers")({
  head: () => ({ meta: [{ title: "Buyer Directory — INDOSATI CRM" }, { name: "description", content: "Saved GeM buyers." }] }),
  component: Page,
});

function Page() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ id?: string; v: BuyerDraft } | null>(null);
  const list = useQuery({ queryKey: ["buyers"], queryFn: async () => (await supabase.from("buyers").select("*, orders(count)").order("name")).data ?? [] });
  const rows = (list.data ?? []).filter((b) => [b.name, b.department, b.city, b.state, b.mobile, b.email].join(" ").toLowerCase().includes(q.toLowerCase()));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const payload = cleanBuyer(edit.v);
    const { error } = edit.id ? await supabase.from("buyers").update(payload).eq("id", edit.id) : await supabase.from("buyers").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success("Buyer saved."); setEdit(null); qc.invalidateQueries();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Buyer Directory" subtitle={`${rows.length} buyers`} actions={<>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search buyers…" className="h-9 rounded-md border bg-card px-3 text-sm" />
        {me?.canOrders && <Button onClick={() => setEdit({ v: emptyBuyer })}>Add buyer</Button>}
      </>} />
      {edit && (
        <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-5">
          <BuyerFields value={edit.v} onChange={(v) => setEdit({ ...edit, v })} />
          <div className="flex gap-2"><Button>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        </form>
      )}
      <Section title="Buyers">
        <DataTable head={["Name", "Department", "Contact", "Mobile", "City / State", "Orders", ""]}
          rows={rows.map((b) => [b.name, b.department ?? "—", b.contact_person ?? "—", b.mobile ?? "—", [b.city, b.state].filter(Boolean).join(", ") || "—",
            (b.orders as unknown as { count: number }[])?.[0]?.count ?? 0,
            me?.canOrders ? <button className="text-xs text-primary hover:underline" onClick={() => setEdit({ id: b.id, v: Object.fromEntries(Object.keys(emptyBuyer).map((k) => [k, (b as Record<string, unknown>)[k] ?? ""])) as BuyerDraft })}>Edit</button> : ""])} />
      </Section>
    </div>
  );
}
