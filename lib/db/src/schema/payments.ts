import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const txTypeEnum = pgEnum("transaction_type", ["topup", "payment", "received", "withdrawal", "escrow_hold", "escrow_release"]);
export const txStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);
export const currencyEnum = pgEnum("currency", ["MWK", "USD"]);

export const walletsTable = pgTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => usersTable.id),
  balance: real("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  type: txTypeEnum("type").notNull(),
  amount: real("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("MWK"),
  description: text("description").notNull(),
  counterparty: text("counterparty"),
  status: txStatusEnum("status").notNull().default("completed"),
  txRef: text("tx_ref"),           // PayChangu tx_ref
  paychanguRef: text("paychangu_ref"), // PayChangu transaction_id
  relatedBookingId: text("related_booking_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ createdAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
