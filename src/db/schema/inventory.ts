import {
  bigint,
  boolean,
  foreignKey,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./auth";
import { tenants } from "./tenants";

/** Tipe form menentukan field yang muncul di "Tambah Barang". */
export const FORM_TYPES = ["laptop", "aksesoris"] as const;
export type FormType = (typeof FORM_TYPES)[number];

/** Status per unit. Gabungan ST (Siap Jual / Belum Siap / Service) + M (Matot). */
export const UNIT_STATUSES = ["SIAP_JUAL", "BELUM_SIAP", "SERVICE", "MATOT"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

/** Grade kualitas unit. */
export const UNIT_GRADES = ["A", "B", "C"] as const;
export type UnitGrade = (typeof UNIT_GRADES)[number];

// ── Master Kategori ─────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 100 }).notNull(),
    formType: mysqlEnum("form_type", FORM_TYPES).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // (tenant_id, id) jadi target composite FK dari products.
    uniqueIndex("categories_tenant_id_id_uq").on(t.tenantId, t.id),
    uniqueIndex("categories_tenant_name_uq").on(t.tenantId, t.name),
  ],
);

// ── Produk (master per model/batch) ─────────────────────────────
export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    categoryId: varchar("category_id", { length: 36 }).notNull(),

    // Umum (laptop & aksesoris)
    name: varchar("name", { length: 200 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    costPrice: bigint("cost_price", { mode: "number" }).notNull().default(0),
    sellPrice: bigint("sell_price", { mode: "number" }).notNull().default(0),
    source: varchar("source", { length: 150 }),
    note: text("note"),

    // Khusus laptop
    cpu: varchar("cpu", { length: 100 }),
    ram: varchar("ram", { length: 60 }),
    storage: varchar("storage", { length: 100 }),
    gpu: varchar("gpu", { length: 100 }),
    display: varchar("display", { length: 100 }),
    condition: varchar("condition", { length: 150 }),

    // Khusus aksesoris
    spec: varchar("spec", { length: 255 }),

    isActive: boolean("is_active").notNull().default(true),
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(), // Tgl Masuk
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // (tenant_id, id) jadi target composite FK dari product_units.
    uniqueIndex("products_tenant_id_id_uq").on(t.tenantId, t.id),
    index("products_tenant_name_idx").on(t.tenantId, t.name),
    index("products_tenant_category_idx").on(t.tenantId, t.categoryId),
    // Produk tak bisa nyambung ke kategori toko lain; hapus kategori ditolak kalau masih dipakai.
    foreignKey({
      name: "products_category_fk",
      columns: [t.tenantId, t.categoryId],
      foreignColumns: [categories.tenantId, categories.id],
    }).onDelete("restrict"),
  ],
);

// ── Unit fisik (per SN) ─────────────────────────────────────────
export const productUnits = mysqlTable(
  "product_units",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    productId: varchar("product_id", { length: 36 }).notNull(),

    serialNumber: varchar("serial_number", { length: 120 }), // SN — awal NULL, diisi manual
    status: mysqlEnum("status", UNIT_STATUSES).notNull().default("BELUM_SIAP"), // ST + M
    sparepartCost: bigint("sparepart_cost", { mode: "number" }).notNull().default(0), // Modal Sparepart
    costPrice: bigint("cost_price", { mode: "number" }).notNull().default(0), // Modal Laptop per unit
    priceSetor: bigint("price_setor", { mode: "number" }).notNull().default(0), // Harga Setor
    priceOfficial: bigint("price_official", { mode: "number" }).notNull().default(0), // Harga Official
    grade: mysqlEnum("grade", UNIT_GRADES), // Grade A/B/C (boleh kosong)
    source: varchar("source", { length: 150 }), // Sumber per unit
    enteredAt: timestamp("entered_at"), // Tanggal Masuk per unit
    stockOpname: boolean("stock_opname").notNull().default(false), // SO
    audited: boolean("audited").notNull().default(false), // Audit
    soldAt: timestamp("sold_at"), // NULL = masih stok
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("product_units_product_idx").on(t.tenantId, t.productId),
    // NULL dianggap distinct di MariaDB → banyak SN kosong boleh; SN terisi wajib unik per toko.
    uniqueIndex("product_units_tenant_sn_uq").on(t.tenantId, t.serialNumber),
    // Unit ikut terhapus kalau produk induknya dihapus; tak bisa lintas toko.
    foreignKey({
      name: "product_units_product_fk",
      columns: [t.tenantId, t.productId],
      foreignColumns: [products.tenantId, products.id],
    }).onDelete("cascade"),
  ],
);