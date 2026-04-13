import { Router } from "express";
import { db } from "@workspace/db";
import { parcelsTable } from "@workspace/db/schema/parcels";
import { tripsTable } from "@workspace/db/schema/trips";
import { usersTable } from "@workspace/db/schema/users";
import { eq } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { genId } from "../lib/id";
import { z } from "zod";

const router = Router();

const CreateParcelSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  deadline: z.string().min(1),
  parcelSize: z.enum(["small", "medium", "large", "extra-large"]),
  notes: z.string().optional(),
  price: z.number().optional(),
});

// GET /api/parcels
router.get("/parcels", async (req, res) => {
  const rows = await db
    .select({ parcel: parcelsTable, user: { name: usersTable.name, rating: usersTable.rating, role: usersTable.role } })
    .from(parcelsTable)
    .innerJoin(usersTable, eq(parcelsTable.userId, usersTable.id));
  res.json({
    parcels: rows.map((r) => ({
      ...r.parcel,
      from: r.parcel.from,
      to: r.parcel.to,
      userName: r.user.name,
      userRating: r.user.rating,
      isVerified: r.user.role === "verified",
      type: "parcel",
    })),
  });
});

// POST /api/parcels
router.post("/parcels", requireAuth, async (req, res) => {
  const parsed = CreateParcelSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);
  const id = genId("p");
  await db.insert(parcelsTable).values({ id, userId: user.id, ...parsed.data });
  const [parcel] = await db.select().from(parcelsTable).where(eq(parcelsTable.id, id)).limit(1);
  res.status(201).json({ parcel: { ...parcel, type: "parcel", userName: user.name, userRating: user.rating, isVerified: user.role === "verified" } });
});

// GET /api/parcels/:id/matches — find trips that can carry this parcel
router.get("/parcels/:id/matches", async (req, res) => {
  const parcelId = String(req.params.id);
  const [parcel] = await db.select().from(parcelsTable).where(eq(parcelsTable.id, parcelId)).limit(1);
  if (!parcel) { res.status(404).json({ error: "Not found" }); return; }

  const rows = await db
    .select({ trip: tripsTable, user: { name: usersTable.name, rating: usersTable.rating, role: usersTable.role } })
    .from(tripsTable)
    .innerJoin(usersTable, eq(tripsTable.userId, usersTable.id));

  const matches = rows
    .filter((r) =>
      r.trip.parcelCapacity &&
      r.trip.from.toLowerCase() === parcel.from.toLowerCase() &&
      r.trip.to.toLowerCase() === parcel.to.toLowerCase() &&
      r.trip.userId !== parcel.userId
    )
    .map((r) => ({ ...r.trip, userName: r.user.name, userRating: r.user.rating, isVerified: r.user.role === "verified" }));

  res.json({ matches });
});

export default router;
