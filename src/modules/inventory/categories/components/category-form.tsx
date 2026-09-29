import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Label } from "@/components/ui/label";
import { FORM_TYPES } from "@/db/schema";
import { FORM_TYPE_LABELS } from "@/modules/inventory/form-config";
import type { CategoryFieldValues } from "@/modules/inventory/categories/actions";

type CategoryFormFieldsProps = {
  values: CategoryFieldValues;
  fieldErrors: Record<string, string>;
};

export function CategoryFormFields({ values, fieldErrors }: CategoryFormFieldsProps) {
  const typeError = fieldErrors.formType;

  return (
    <>
      <FormField
        id="name"
        label="Nama kategori"
        defaultValue={values.name}
        error={fieldErrors.name}
        placeholder="Laptop, Mouse, SSD, Printer..."
        required
      />

      <div className="grid gap-2">
        <Label htmlFor="formType">Tipe form</Label>
        <NativeSelect
          id="formType"
          name="formType"
          defaultValue={values.formType}
          aria-invalid={Boolean(typeError)}
          aria-describedby={typeError ? "formType-error" : undefined}
        >
          <option value="" disabled>
            -- Pilih tipe form --
          </option>
          {FORM_TYPES.map((type) => (
            <option key={type} value={type}>
              {FORM_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
        {typeError ? (
          <p id="formType-error" className="text-sm text-destructive">
            {typeError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Menentukan field yang muncul saat menambah barang di kategori ini.
          </p>
        )}
      </div>
    </>
  );
}