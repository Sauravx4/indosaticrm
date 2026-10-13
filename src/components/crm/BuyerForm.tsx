import { Input } from "@/components/ui/input";
import { Field } from "./ui";

export type BuyerDraft = {
  name: string; department: string; org_type: string; contact_person: string; mobile: string; email: string;
  billing_address: string; delivery_address: string; city: string; district: string; state: string; pin_code: string;
  other_contacts: string; remarks: string;
};
export const emptyBuyer: BuyerDraft = {
  name: "", department: "", org_type: "", contact_person: "", mobile: "", email: "", billing_address: "",
  delivery_address: "", city: "", district: "", state: "", pin_code: "", other_contacts: "", remarks: "",
};

const fields: [keyof BuyerDraft, string, boolean?][] = [
  ["name", "Buyer / Organisation name", true], ["department", "Department / Ministry"], ["org_type", "Organisation type"],
  ["contact_person", "Contact person"], ["mobile", "Mobile"], ["email", "Email"],
  ["billing_address", "Billing address"], ["delivery_address", "Delivery address"], ["city", "City"],
  ["district", "District"], ["state", "State"], ["pin_code", "PIN code"], ["other_contacts", "Other contacts"], ["remarks", "Buyer remarks"],
];

export function BuyerFields({ value, onChange }: { value: BuyerDraft; onChange: (v: BuyerDraft) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {fields.map(([k, label, req]) => (
        <Field key={k} label={label} required={req}>
          <Input value={value[k]} required={req}
            pattern={k === "mobile" ? "[0-9+ ]{10,14}" : k === "pin_code" ? "[0-9]{6}" : undefined}
            type={k === "email" ? "email" : "text"}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
        </Field>
      ))}
    </div>
  );
}

export function cleanBuyer(b: BuyerDraft) {
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.trim() || null])) as Record<keyof BuyerDraft, string | null> & { name: string };
}
