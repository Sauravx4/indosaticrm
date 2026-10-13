import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, type Role } from "@/lib/session";
import { download, toCSV } from "@/lib/crm";
import { DataTable, PageHeader, Section } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings & Users — INDOSATI CRM" }, { name: "description", content: "Manage users, roles and data exports." }] }),
  component: Page,
});

const ROLES: Role[] = ["admin", "order_manager", "accounts_manager", "viewer"];
const TABLES = ["buyers", "orders", "order_items", "dispatches", "dispatch_items", "crac_records", "payments", "adjustments", "sms_notifications", "attachments"] as const;

function Page() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const users = useQuery({
    queryKey: ["users"], enabled: !!me?.isAdmin,
    queryFn: async () => {
      const [p, r] = await Promise.all([supabase.from("profiles").select("*").order("created_at"), supabase.from("user_roles").select("*")]);
      return (p.data ?? []).map((u) => ({ ...u, roles: (r.data ?? []).filter((x) => x.user_id === u.id).map((x) => x.role as Role) }));
    },
  });
  const audit = useQuery({ queryKey: ["audit-all"], enabled: !!me?.isAdmin, queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [] });

  if (!me?.isAdmin) return <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">Only administrators can open settings.</div>;

  async function setRole(uid: string, role: Role) {
    if (uid === me!.user.id && role !== "admin") return void toast.error("You can't remove your own admin role.");
    await supabase.from("user_roles").delete().eq("user_id", uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return void toast.error(error.message);
    toast.success("Role updated."); qc.invalidateQueries({ queryKey: ["users"] });
  }
  async function updatePhone(uid: string, phone: string) {
    const { error } = await supabase.from("profiles").update({ phone }).eq("id", uid);
    if (error) return void toast.error(error.message);
    toast.success("Mobile number saved.");
  }
  async function backup() {
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
    for (const t of TABLES) out[t] = (await supabase.from(t).select("*")).data;
    download(`indosati-crm-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(out, null, 2), "application/json");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & User Management" />
      <Section title="Users and roles">
        <DataTable head={["Name", "Email", "Mobile (for SMS reminders)", "Role"]}
          rows={(users.data ?? []).map((u) => [u.full_name ?? "—", u.email,
            <input defaultValue={u.phone ?? ""} placeholder="10-digit mobile" className="h-8 rounded border bg-card px-2 text-sm" onBlur={(e) => e.target.value !== (u.phone ?? "") && updatePhone(u.id, e.target.value)} />,
            <select value={u.roles[0] ?? ""} onChange={(e) => setRole(u.id, e.target.value as Role)} className="h-8 rounded border bg-card px-2 text-sm">
              <option value="" disabled>No role</option>{ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>])} />
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">New team members sign up on the sign-in page, then appear here as Viewer.</p>
      </Section>
      <Section title="Backup & export">
        <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
          <Button variant="outline" onClick={backup}>Download full backup (JSON)</Button>
          <Button variant="outline" onClick={async () => download("orders.csv", toCSV((await supabase.from("order_summary").select("*")).data ?? []))}>Orders CSV</Button>
          <span className="text-muted-foreground">The database is also backed up automatically every day by Lovable Cloud.</span>
        </div>
      </Section>
      <Section title="Recent changes (audit log)">
        <DataTable head={["When", "Table", "Action", "User"]} rows={(audit.data ?? []).map((a) => [new Date(a.created_at).toLocaleString("en-IN"), a.table_name, a.action, (users.data ?? []).find((u) => u.id === a.user_id)?.email ?? "system"])} />
      </Section>
    </div>
  );
}
