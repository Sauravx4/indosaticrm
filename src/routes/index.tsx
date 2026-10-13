import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INDOSATI GeM Seller CRM" },
      { name: "description", content: "Track GeM orders, dispatch deadlines, CRAC and payments for INDOSATI." },
      { property: "og:title", content: "INDOSATI GeM Seller CRM" },
      { property: "og:description", content: "Track GeM orders, dispatch deadlines, CRAC and payments for INDOSATI." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
