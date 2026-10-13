import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useOrders } from "@/lib/session";
import { addDays, dispatchStatus, fmtDate, todayISO } from "@/lib/crm";
import { DataTable, Field, OrderLink, PageHeader, Section, StatusPill } from "@/components/crm/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/sms")({
  head: () => ({ meta: [{ title: "SMS Reminders — INDOSATI CRM" }, { name: "description", content: "Dispatch deadline SMS reminders." }] }),
  component: Page,
});

function Page() {
  const { data: me } = useMe();
  const { data: orders = [] } = useOrders();
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: async () => Object.fromEntries(((await supabase.from("app_settings").select("*")).data ?? []).map((s) => [s.key, s.value])) as Record<string, unknown> });
  const logs = useQuery({ queryKey: ["sms-logs"], queryFn: async () => (await supabase.from("sms_notifications").select("*, orders(gem_order_number)").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  const [tpl, setTpl] = useState("");
  const [rem, setRem] = useState({ days_before: 5, send_time: "10:00", weekend_policy: "previous_working_day", overdue_repeat_days: 1 });
  useEffect(() => {
    if (!settings.data) return;
    setTpl(String(settings.data.sms_template ?? ""));
    if (settings.data.reminder) setRem(settings.data.reminder as typeof rem);
  }, [settings.data]);

  async function save() {
    if (rem.days_before < 5) return void toast.error("Reminders must be at least 5 days before the deadline.");
    const { error } = await supabase.from("app_settings").upsert([{ key: "sms_template", value: tpl }, { key: "reminder", value: rem }]);
    if (error) return void toast.error(error.message);
    toast.success("Reminder settings saved."); qc.invalidateQueries({ queryKey: ["settings"] });
  }

  const t = todayISO();
  const upcoming = orders.filter((o) => !o.cancelled && !["Fully Dispatched", "Delivered"].includes(dispatchStatus(o)))
    .map((o) => ({ o, date: addDays(o.dispatch_deadline!, -rem.days_before) })).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Reminders" subtitle="Reminders go to the employee assigned to each order." />
      <div className="rounded-lg border border-warning bg-warning/10 p-4 text-sm">
        <b>Fast2SMS not connected yet.</b> Reminder dates are calculated and shown below, but no SMS is sent until the Fast2SMS key is added and a test message succeeds. This is the next build stage.
      </div>
      <Section title="Upcoming reminder schedule">
        <DataTable head={["GeM order", "Buyer", "Deadline", "Reminder date", "Note"]}
          rows={upcoming.slice(0, 30).map(({ o, date }) => [<OrderLink id={o.id!} label={o.gem_order_number!} />, o.buyer_name ?? "—", fmtDate(o.dispatch_deadline), fmtDate(date),
            o.dispatch_deadline! < t ? <StatusPill status="Overdue — daily alert" /> : date < t ? <StatusPill status="Reminder date passed — attention" /> : date === t ? <StatusPill status="Due today" /> : "Scheduled"])} />
      </Section>
      {me?.isAdmin && (
        <Section title="Reminder settings">
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <Field label="Days before deadline (min 5)"><Input type="number" min={5} value={rem.days_before} onChange={(e) => setRem({ ...rem, days_before: Number(e.target.value) })} /></Field>
            <Field label="Send time (IST)"><Input type="time" value={rem.send_time} onChange={(e) => setRem({ ...rem, send_time: e.target.value })} /></Field>
            <Field label="If reminder falls on Sunday/holiday">
              <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={rem.weekend_policy} onChange={(e) => setRem({ ...rem, weekend_policy: e.target.value })}>
                <option value="previous_working_day">Send on previous working day</option><option value="same_day">Send anyway</option>
              </select>
            </Field>
            <Field label="Repeat overdue alert every (days)"><Input type="number" min={1} value={rem.overdue_repeat_days} onChange={(e) => setRem({ ...rem, overdue_repeat_days: Number(e.target.value) })} /></Field>
            <div className="md:col-span-4">
              <Field label="Message template — {GeM_Order_Number} {Buyer_Name} {Dispatch_Deadline} {Days_Left} {Product_Name}"><Textarea rows={3} value={tpl} onChange={(e) => setTpl(e.target.value)} /></Field>
            </div>
            <div><Button onClick={save}>Save settings</Button></div>
          </div>
        </Section>
      )}
      <Section title="Delivery log">
        <DataTable head={["Scheduled", "GeM order", "Type", "Recipient", "Sent", "Status", "Error"]}
          rows={(logs.data ?? []).map((s) => [fmtDate(s.scheduled_date), s.orders?.gem_order_number ?? "—", s.kind, s.recipient ?? "—", s.sent_at ? new Date(s.sent_at).toLocaleString("en-IN") : "—", <StatusPill status={s.status} />, s.error ?? ""])} />
      </Section>
    </div>
  );
}
