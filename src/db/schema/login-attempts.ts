import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const loginAttempts = mysqlTable("login_attempts", {
  key: varchar("attempt_key", { length: 255 }).primaryKey(),
  failures: int("failures").notNull().default(0),
  windowStartedAt: timestamp("window_started_at").notNull(),
  lockedUntil: timestamp("locked_until"),
});