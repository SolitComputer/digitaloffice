import { FormField } from "@/components/form-field";
import type { ProductFieldValues } from "@/modules/inventory/actions";
import type { ProductField } from "@/modules/inventory/form-config";

type ProductFormFieldsProps = {
  fields: ProductField[];
  values: ProductFieldValues;
  fieldErrors: Record<string, string>;
};

export function ProductFormFields({ fields, values, fieldErrors }: ProductFormFieldsProps) {
  return (
    <div className="grid gap-4">
      {fields.map((field) => (
        <FormField
          key={field.name}
          id={field.name}
          label={field.required ? field.label : `${field.label} (opsional)`}
          defaultValue={values[field.name] ?? ""}
          error={fieldErrors[field.name]}
          required={field.required}
          inputMode={field.numeric ? "numeric" : undefined}
          placeholder={field.numeric ? "0" : undefined}
        />
      ))}
    </div>
  );
}