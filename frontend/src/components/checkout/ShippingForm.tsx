import type { ShippingAddress } from "@/lib/api/types";
import { Input } from "@/components/ui/Input";

export type ShippingFormValues = ShippingAddress;

export interface ShippingFormProps {
  values: ShippingFormValues;
  onChange: (field: keyof ShippingFormValues, value: string) => void;
  errors?: Partial<Record<keyof ShippingFormValues, string>>;
  disabled?: boolean;
}

const fields: { key: keyof ShippingFormValues; label: string; placeholder: string }[] = [
  { key: "name", label: "Full name", placeholder: "Jane Doe" },
  { key: "street", label: "Street address", placeholder: "123 Main St" },
  { key: "city", label: "City", placeholder: "San Francisco" },
  { key: "state", label: "State / Province", placeholder: "CA" },
  { key: "zip", label: "ZIP / Postal code", placeholder: "94102" },
  { key: "country", label: "Country", placeholder: "United States" },
];

export function ShippingForm({
  values,
  onChange,
  errors = {},
  disabled = false,
}: ShippingFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.key}
          className={field.key === "street" || field.key === "name" ? "sm:col-span-2" : ""}
        >
          <Input
            label={field.label}
            name={field.key}
            value={values[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            error={errors[field.key]}
            disabled={disabled}
            autoComplete={
              field.key === "name"
                ? "name"
                : field.key === "street"
                  ? "street-address"
                  : field.key === "city"
                    ? "address-level2"
                    : field.key === "state"
                      ? "address-level1"
                      : field.key === "zip"
                        ? "postal-code"
                        : "country-name"
            }
          />
        </div>
      ))}
    </div>
  );
}
