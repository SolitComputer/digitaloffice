import { FormField } from "@/components/form-field";
import type { ProductFieldValues } from "@/modules/inventory/actions";

type ProductFormFieldsProps = {
  values: ProductFieldValues & { initialStock?: string };
  fieldErrors: Record<string, string>;
};

export function ProductFormFields({ values, fieldErrors }: ProductFormFieldsProps) {
  return (
    <>
      <FormField id="name" label="Nama produk" defaultValue={values.name} error={fieldErrors.name} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="sku" label="SKU (opsional)" defaultValue={values.sku} error={fieldErrors.sku} placeholder="KPI-001" />
        <FormField id="unit" label="Satuan" defaultValue={values.unit} error={fieldErrors.unit} placeholder="pcs, kg, box" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="costPrice" label="Harga modal" inputMode="numeric" defaultValue={values.costPrice} error={fieldErrors.costPrice} placeholder="20.000" />
        <FormField id="sellPrice" label="Harga jual" inputMode="numeric" defaultValue={values.sellPrice} error={fieldErrors.sellPrice} placeholder="25.000" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {values.initialStock !== undefined ? (
          <FormField id="initialStock" label="Stok awal" inputMode="numeric" defaultValue={values.initialStock} error={fieldErrors.initialStock} />
        ) : null}
        <FormField id="minStock" label="Batas stok minimum" inputMode="numeric" defaultValue={values.minStock} error={fieldErrors.minStock} hint="Isi 0 kalau tidak ingin dipantau." />
      </div>
    </>
  );
}
