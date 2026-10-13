import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/crm";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", tones[statusTone(status)])}>
      {status}
    </span>
  );
}

export function Kpi({ label, value, to, search, tone }: { label: string; value: ReactNode; to: string; search?: Record<string, string>; tone?: "danger" | "warning" }) {
  return (
    <Link
      to={to}
      search={search as never}
      className={cn(
        "group rounded-lg border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm",
        tone === "danger" && "border-l-4 border-l-destructive",
        tone === "warning" && "border-l-4 border-l-warning",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</div>
    </Link>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  if (!rows.length) return <Empty>Nothing to show.</Empty>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-2 font-medium">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-muted/30">
            {r.map((c, j) => <td key={j} className="whitespace-nowrap px-4 py-2">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

export function OrderLink({ id, label }: { id: string; label: string }) {
  return (
    <Link to="/orders/$id" params={{ id }} className="font-medium text-primary hover:underline">
      {label}
    </Link>
  );
}
