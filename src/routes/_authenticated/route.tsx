import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, FileText, PlusCircle, Truck, BadgeCheck, IndianRupee, Building2, MapPin,
  MessageSquare, BarChart3, Sheet, Settings, LogOut, Menu, Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "GeM Orders", icon: FileText },
  { to: "/orders/new", label: "Add New Order", icon: PlusCircle },
  { to: "/dispatch", label: "Dispatch Management", icon: Truck },
  { to: "/crac", label: "CRAC Management", icon: BadgeCheck },
  { to: "/payments", label: "Payment Management", icon: IndianRupee },
  { to: "/buyers", label: "Buyer Directory", icon: Building2 },
  { to: "/transport", label: "Transport & Tracking", icon: MapPin },
  { to: "/sms", label: "SMS Reminders", icon: MessageSquare },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/sheets", label: "Google Sheets", icon: Sheet },
  { to: "/settings", label: "Settings & Users", icon: Settings },
] as const;

function Layout() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center px-5 font-display text-lg font-semibold text-sidebar-accent-foreground">
          INDOSATI<span className="text-sidebar-primary">.</span><span className="ml-2 text-xs font-normal text-sidebar-foreground/60">GeM CRM</span>
        </div>
        <nav className="space-y-0.5 px-3">
          {nav.map((n) => {
            const active = n.to === "/orders" ? path === "/orders" || (path.startsWith("/orders/") && path !== "/orders/new") : path === n.to;
            return (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60")}>
                <n.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border p-4 text-xs">
          <div className="truncate text-sidebar-accent-foreground">{me?.user.email}</div>
          <div className="mt-0.5 text-sidebar-foreground/60">{me?.roles.map((r) => r.replace("_", " ")).join(", ") || "No role"}</div>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"><LogOut className="h-3.5 w-3.5" />Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
          <form className="relative w-full max-w-md" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/orders", search: { q } as never }); }}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no., buyer, product, invoice, docket, CRAC, UTR…"
              className="h-9 w-full rounded-md border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </form>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          {me && me.roles.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">Your account has no role yet. Ask an administrator to assign one.</div>
          ) : <Outlet />}
        </main>
      </div>
    </div>
  );
}
