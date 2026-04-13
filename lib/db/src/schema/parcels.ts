import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const parcelSizeEnum = pgEnum("parcel_size", ["small", "medium", "large", "extra-large"]);
export const parcelStatusEnum = pgEnum("parcel_status", ["open", "matched", "in_transit", "delivered"]);

export const parcelsTable = pgTable("parcels", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  from: text("from_location").notNull(),
  to: text("to_location").notNull(),
  deadline: text("deadline").notNull(),
  parcelSize: parcelSizeEnum("parcel_size").notNull(),
  notes: text("notes"),
  price: real("price"),
  status: parcelStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertParcelSchema = createInsertSchema(parcelsTable).omit({ createdAt: true });
export type InsertParcel = z.infer<typeof insertParcelSchema>;
export type Parcel = typeof parcelsTable.$inferSelect;
