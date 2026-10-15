import {
  bigint,
  boolean,
  date,
  index,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./auth";
import { tenants } from "./tenants";

export const CASHFLOW_DIRECTIONS = ["IN", "OUT"] as const;
export type CashflowDirection = (typeof CASHFLOW_DIRECTIONS)[number];

export const CASHFLOW_METHODS = ["CASH", "SALDO"] as const;
export type CashflowMethod = (typeof CASHFLOW_METHODS)[number];

// Kategori bisa dipakai utk arah apa: masuk, keluar, atau keduanya.
export const CASHFLOW_CATEGORY_TYPES = ["IN", "OUT", "BOTH"] as const;
export type CashflowCategoryType = (typeof CASHFLOW_CATEGORY_TYPES)[number];

export const cashflowCategories = mysqlTable(
  "cashflow_categories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    type: mysqlEnum("type", CASHFLOW_CATEGORY_TYPES).notNull().default("BOTH"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("cashflow_categories_tenant_idx").on(t.tenantId)],
);

export const cashflowEntries = mysqlTable(
  "cashflow_entries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    direction: mysqlEnum("direction", CASHFLOW_DIRECTIONS).notNull(),
    method: mysqlEnum("method", CASHFLOW_METHODS).notNull().default("CASH"),
    categoryId: varchar("category_id", { length: 36 }).references(() => cashflowCategories.id, {
      onDelete: "set null",
    }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    note: varchar("note", { length: 255 }),
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("cashflow_entries_tenant_date_idx").on(t.tenantId, t.date),
    index("cashflow_entries_tenant_dir_idx").on(t.tenantId, t.direction),
  ],
);