import type { Database } from "@/integrations/supabase/types";

export type OrderSummary = Database["public"]["Views"]["order_summary"]["Row"];

const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const inr = (n: number | null | undefined) => inrFmt.format(Number(n ?? 0));

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}-${m}-${y}`;
}

export function todayISO() {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000); // IST
  return now.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DISPATCH_STATUSES = [
  "Pending Dispatch",
  "Dispatch Due Soon",
  "Dispatch Overdue",
  "Partially Dispatched",
  "Fully Dispatched",
  "Delivered",
  "Cancelled",
] as const;

export function dispatchStatus(o: OrderSummary): string {
  if (o.cancelled) return "Cancelled";
  const total = Number(o.total_qty ?? 0);
  const sent = Number(o.dispatched_qty ?? 0);
  const full = total > 0 && sent >= total;
  if (full && Number(o.delivered_count) > 0 && Number(o.delivered_count) >= Number(o.dispatch_count)) return "Delivered";
  if (full) return "Fully Dispatched";
  if (sent > 0) return "Partially Dispatched";
  const left = daysBetween(todayISO(), o.dispatch_deadline!);
  if (left < 0) return "Dispatch Overdue";
  if (left <= 5) return "Dispatch Due Soon";
  return "Pending Dispatch";
}

export const PAYMENT_STAGES = [
  "GeM Order Received",
  "Product Dispatched",
  "Product Delivered",
  "CRAC Awaited",
  "CRAC Generated",
  "Payment Awaited",
  "Part Payment Received",
  "Full Payment Received",
  "Payment Reconciliation Required",
] as const;

export function netReceivable(o: OrderSummary) {
  return Number(o.official_value ?? 0) + Number(o.adjustments_total ?? 0);
}
export function outstanding(o: OrderSummary) {
  return netReceivable(o) - Number(o.amount_received ?? 0);
}

export function paymentStage(o: OrderSummary): string {
  const rec = Number(o.amount_received ?? 0);
  const out = outstanding(o);
  if (out < 0) return "Payment Reconciliation Required";
  if (rec > 0 && out === 0) return "Full Payment Received";
  if (rec > 0) return "Part Payment Received";
  if (Number(o.crac_generated_count) > 0) return "Payment Awaited";
  if (Number(o.delivered_count) > 0) return "CRAC Awaited";
  if (Number(o.dispatch_count) > 0) return "Product Dispatched";
  return "GeM Order Received";
}

export function statusTone(s: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (/Overdue|Reconciliation|Issue|failed/i.test(s)) return "danger";
  if (/Due Soon|Pending|Awaited|Part|Partially|Awaiting/i.test(s)) return "warning";
  if (/Delivered|Full|Generated|sent|Fully/i.test(s)) return "success";
  if (/Cancelled/i.test(s)) return "muted";
  return "default";
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function download(name: string, content: string, type = "text/csv") {
  const blob = new Blob(["\uFEFF" + content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Excel-compatible spreadsheet (SpreadsheetML) – opens in Excel as .xls
export function toExcel(rows: Record<string, unknown>[], sheet = "Report") {
  const cols = rows.length ? Object.keys(rows[0]!) : [];
  const x = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cell = (v: unknown) =>
    typeof v === "number" ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>` : `<Cell><Data ss:Type="String">${x(v)}</Data></Cell>`;
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${x(sheet)}"><Table><Row>${cols.map(cell).join("")}</Row>${rows
    .map((r) => `<Row>${cols.map((c) => cell(r[c])).join("")}</Row>`)
    .join("")}</Table></Worksheet></Workbook>`;
}
