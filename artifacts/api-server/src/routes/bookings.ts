import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db/schema/bookings";
import { parcelsTable } from "@workspace/db/schema/parcels";
import { tripsTable } from "@workspace/db/schema/trips";
import { usersTable } from "@workspace/db/schema/users";
import { notificationsTable } from "@workspace/db/schema/notifications";
import { walletsTable, transactionsTable } from "@workspace/db/schema/payments";
import { eq, or } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { genId, genOtp } from "../lib/id";
import { z } from "zod";

const router = Router();

const CreateBookingSchema = z.object({
  tripId: z.string(),
  parcelId: z.string(),
  price: z.number().optional(),
});

// GET /api/bookings — user's bookings (as requester or carrier)
router.get("/bookings", requireAuth, async (req, res) => {
  const user = getUser(req);
  const bookings = await db.select().from(bookingsTable)
    .where(or(eq(bookingsTable.requesterId, user.id), eq(bookingsTable.carrierId, user.id)));

  // Enrich with names
  const enriched = await Promise.all(bookings.map(async (b) => {
    const [requester] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.requesterId)).limit(1);
    const [carrier] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.carrierId)).limit(1);
    return { ...b, requesterName: requester?.name ?? "Unknown", carrierName: carrier?.name ?? "Unknown" };
  }));

  res.json({ bookings: enriched });
});

// POST /api/bookings
router.post("/bookings", requireAuth, async (req, res) => {
  const parsed = CreateBookingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, parsed.data.tripId)).limit(1);
  const [parcel] = await db.select().from(parcelsTable).where(eq(parcelsTable.id, parsed.data.parcelId)).limit(1);
  if (!trip || !parcel) { res.status(404).json({ error: "Trip or parcel not found" }); return; }

  const id = genId("b");
  const price = parsed.data.price ?? parcel.price ?? trip.price ?? 0;
  await db.insert(bookingsTable).values({
    id,
    tripId: trip.id,
    parcelId: parcel.id,
    requesterId: user.id,
    carrierId: trip.userId,
    from: trip.from,
    to: trip.to,
    date: trip.date,
    status: "pending",
    pickupOtp: genOtp(),
    price,
  });

  // Update parcel status
  await db.update(parcelsTable).set({ status: "matched" }).where(eq(parcelsTable.id, parcel.id));

  // Notify carrier
  await db.insert(notificationsTable).values({
    id: genId("n"), userId: trip.userId, type: "booking_request",
    title: "New booking request", body: `${user.name} wants to send a parcel ${trip.from} → ${trip.to}`,
    relatedId: id, read: false,
  });

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  res.status(201).json({ booking });
});

// PATCH /api/bookings/:id/accept
router.patch("/bookings/:id/accept", requireAuth, async (req, res) => {
  const user = getUser(req);
  const bookingId = String(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.carrierId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(bookingsTable).set({ status: "accepted" }).where(eq(bookingsTable.id, booking.id));
  await db.insert(notificationsTable).values({
    id: genId("n"), userId: booking.requesterId, type: "booking_accepted",
    title: "Booking accepted!", body: `${user.name} accepted your parcel request`, relatedId: booking.id, read: false,
  });
  res.json({ success: true });
});

// PATCH /api/bookings/:id/decline
router.patch("/bookings/:id/decline", requireAuth, async (req, res) => {
  const user = getUser(req);
  const bookingId = String(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.carrierId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(bookingsTable).set({ status: "declined" }).where(eq(bookingsTable.id, booking.id));
  await db.update(parcelsTable).set({ status: "open" }).where(eq(parcelsTable.id, booking.parcelId));
  await db.insert(notificationsTable).values({
    id: genId("n"), userId: booking.requesterId, type: "booking_declined",
    title: "Booking declined", body: `${user.name} declined your parcel request`, relatedId: booking.id, read: false,
  });
  res.json({ success: true });
});

// PATCH /api/bookings/:id/collect — carrier enters OTP to collect parcel
router.patch("/bookings/:id/collect", requireAuth, async (req, res) => {
  const user = getUser(req);
  const { otp } = req.body as { otp: string };
  const bookingId = String(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.carrierId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  if (booking.pickupOtp !== otp) { res.status(400).json({ error: "Invalid OTP" }); return; }

  await db.update(bookingsTable).set({ status: "collected" }).where(eq(bookingsTable.id, booking.id));
  await db.update(parcelsTable).set({ status: "in_transit" }).where(eq(parcelsTable.id, booking.parcelId));
  res.json({ success: true });
});

// PATCH /api/bookings/:id/deliver — carrier confirms delivery, releases payment
router.patch("/bookings/:id/deliver", requireAuth, async (req, res) => {
  const user = getUser(req);
  const bookingId = String(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.carrierId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(bookingsTable).set({ status: "delivered" }).where(eq(bookingsTable.id, booking.id));
  await db.update(parcelsTable).set({ status: "delivered" }).where(eq(parcelsTable.id, booking.parcelId));

  // Credit carrier wallet (escrow release)
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  if (wallet) {
    await db.update(walletsTable).set({ balance: wallet.balance + booking.price }).where(eq(walletsTable.userId, user.id));
  }
  await db.insert(transactionsTable).values({
    id: genId("tx"), userId: user.id, type: "received", amount: booking.price,
    currency: "MWK", description: "Delivery payment received", counterparty: booking.requesterId,
    status: "completed", relatedBookingId: booking.id,
  });

  await db.insert(notificationsTable).values({
    id: genId("n"), userId: booking.requesterId, type: "delivery_confirmed",
    title: "Parcel delivered!", body: "Your parcel has been delivered successfully", relatedId: booking.id, read: false,
  });
  res.json({ success: true });
});

export default router;
