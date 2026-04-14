import { pgTable, text, integer, real, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["guest", "basic", "verified", "admin"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email").unique(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  role: userRoleEnum("role").notNull().default("basic"),
  rating: real("rating").notNull().default(5.0),
  tripsCompleted: integer("trips_completed").notNull().default(0),
  avatarUrl: text("avatar_url"),
  idDocumentUrl: text("id_document_url"),
  selfieUrl: text("selfie_url"),
  verificationStatus: verificationStatusEnum("verification_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
