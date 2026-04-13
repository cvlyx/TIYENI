import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tripsTable } from "./trips";
import { parcelsTable } from "./parcels";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "accepted", "declined", "collected", "delivered"]);

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().references(() => tripsTable.id),
  parcelId: text("parcel_id").notNull().references(() => parcelsTable.id),
  requesterId: text("requester_id").notNull().references(() => usersTable.id),
  carrierId: text("carrier_id").notNull().references(() => usersTable.id),
  from: text("from_location").notNull(),
  to: text("to_location").notNull(),
  date: text("date").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  pickupOtp: text("pickup_otp").notNull(),
  price: real("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
