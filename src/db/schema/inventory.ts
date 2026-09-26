import {
  bigint,
  boolean,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./auth";
import { tenants } from "./tenants";

export const STOCK_MOVEMENT_TYPES = ["IN", "OUT", "ADJUST"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    sku: varchar("sku", { length: 60 }),
    name: varchar("name", { length: 200 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull().default("pcs"),
    costPrice: bigint("cost_price", { mode: "number" }).notNull().default(0),
    sellPrice: bigint("sell_price", { mode: "number" }).notNull().default(0),
    stock: int("stock").notNull().default(0),
    minStock: int("min_stock").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("products_tenant_id_id_uq").on(t.tenantId, t.id),
    uniqueIndex("products_tenant_sku_uq").on(t.tenantId, t.sku),
    index("products_tenant_name_idx").on(t.tenantId, t.name),
  ],
);

export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 36 }).notNull(),
    type: mysqlEnum("type", STOCK_MOVEMENT_TYPES).notNull(),
    quantityChange: int("quantity_change").notNull(),
    stockAfter: int("stock_after").notNull(),
    note: varchar("note", { length: 255 }),
    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "stock_movements_product_fk",
      columns: [t.tenantId, t.productId],
      foreignColumns: [products.tenantId, products.id],
    }),
    index("stock_movements_product_idx").on(t.tenantId, t.productId, t.createdAt),
    index("stock_movements_tenant_date_idx").on(t.tenantId, t.createdAt),
  ],
);