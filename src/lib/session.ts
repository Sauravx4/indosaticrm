import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "order_manager" | "accounts_manager" | "viewer";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const r = (roles ?? []).map((x) => x.role as Role);
      return {
        user: u.user,
        roles: r,
        isAdmin: r.includes("admin"),
        canOrders: r.includes("admin") || r.includes("order_manager"),
        canPayments: r.includes("admin") || r.includes("accounts_manager"),
      };
    },
    staleTime: 60_000,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_summary").select("*").order("order_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email, phone")).data ?? [],
  });
}
