import { index, mysqlTable, varchar, mysqlEnum, timestamp, boolean, int } from "drizzle-orm/mysql-core";

export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  status: mysqlEnum("status", ["ACTIVE", "SUSPENDED"]).notNull().default("ACTIVE"),
  workStartTime: varchar("work_start_time", { length: 5 }).notNull().default("09:00"),
  workEndTime: varchar("work_end_time", { length: 5 }).notNull().default("17:00"),
  faceRequired: boolean("face_required").notNull().default(false),
  gpsRequired: boolean("gps_required").notNull().default(false),
  gpsLat: varchar("gps_lat", { length: 32 }),
  gpsLng: varchar("gps_lng", { length: 32 }),
  gpsRadius: int("gps_radius").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("tenants_created_at_idx").on(t.createdAt)]);