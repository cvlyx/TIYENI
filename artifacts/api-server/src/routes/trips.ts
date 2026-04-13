import { Router } from "express";
import { db } from "@workspace/db";
import { tripsTable } from "@workspace/db/schema/trips";
import { usersTable } from "@workspace/db/schema/users";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { genId } from "../lib/id";
import { z } from "zod";

const router = Router();

const CreateTripSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  seatsAvailable: z.number().int().min(1),
  parcelCapacity: z.boolean(),
  price: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/trips
router.get("/trips", async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const rows = await db
    .select({ trip: tripsTable, user: { name: usersTable.name, rating: usersTable.rating, role: usersTable.role } })
    .from(tripsTable)
    .innerJoin(usersTable, eq(tripsTable.userId, usersTable.id));

  const filtered = rows.filter((r) => {
    if (from && !r.trip.from.toLowerCase().includes(from.toLowerCase())) return false;
    if (to && !r.trip.to.toLowerCase().includes(to.toLowerCase())) return false;
    return true;
  });

  res.json({
    trips: filtered.map((r) => ({
      ...r.trip,
      from: r.trip.from,
      to: r.trip.to,
      userName: r.user.name,
      userRating: r.user.rating,
      isVerified: r.user.role === "verified",
      type: "trip",
    })),
  });
});

// POST /api/trips
router.post("/trips", requireAuth, async (req, res) => {
  const parsed = CreateTripSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);
  const id = genId("t");
  await db.insert(tripsTable).values({ id, userId: user.id, ...parsed.data });
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, id)).limit(1);
  res.status(201).json({ trip: { ...trip, type: "trip", userName: user.name, userRating: user.rating, isVerified: user.role === "verified" } });
});

// PATCH /api/trips/:id — edit trip
router.patch("/trips/:id", requireAuth, async (req, res) => {
  const user = getUser(req);
  const tripId = String(req.params.id);
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1);
  if (!trip) { res.status(404).json({ error: "Not found" }); return; }
  if (trip.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = CreateTripSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  await db.update(tripsTable).set(parsed.data).where(eq(tripsTable.id, tripId));
  const [updated] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1);
  res.json({ trip: { ...updated, type: "trip", userName: user.name, userRating: user.rating, isVerified: user.role === "verified" } });
});
router.delete("/trips/:id", requireAuth, async (req, res) => {
  const user = getUser(req);
  const tripId = String(req.params.id);
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1);
  if (!trip) { res.status(404).json({ error: "Not found" }); return; }
  if (trip.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(tripsTable).where(eq(tripsTable.id, tripId));
  res.json({ success: true });
});

export default router;
