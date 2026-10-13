import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/crm/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — INDOSATI GeM CRM" },
      { name: "description", content: "Sign in to the INDOSATI GeM Seller CRM." },
      { property: "og:title", content: "Sign in — INDOSATI GeM CRM" },
      { property: "og:description", content: "Sign in to the INDOSATI GeM Seller CRM." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return void toast.error(String(r.error.message ?? r.error));
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="font-display text-xl font-semibold">INDOSATI<span className="text-sidebar-primary">.</span></div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-sidebar-accent-foreground">GeM orders, from award to final payment.</h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">Dispatch deadlines, CRAC follow-ups and outstanding balances in one register.</p>
        </div>
        <div className="text-xs text-sidebar-foreground/50">INDOSATI Instruments & Chemicals</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h2>
          {mode === "up" && (
            <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          )}
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New team member? Create an account" : "Already have an account? Sign in"}
          </button>
          <p className="text-xs text-muted-foreground">The first account becomes Administrator. Later accounts start as Viewer until an admin assigns a role.</p>
        </form>
      </div>
    </div>
  );
}
