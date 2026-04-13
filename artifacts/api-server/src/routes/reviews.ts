import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db/schema/reviews";
import { usersTable } from "@workspace/db/schema/users";
import { bookingsTable } from "@workspace/db/schema/bookings";
import { eq, avg } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { genId } from "../lib/id";
import { z } from "zod";

const router = Router();

const CreateReviewSchema = z.object({
  bookingId: z.string(),
  revieweeId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// POST /api/reviews
router.post("/reviews", requireAuth, async (req, res) => {
  const parsed = CreateReviewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);

  const id = genId("r");
  await db.insert(reviewsTable).values({ id, reviewerId: user.id, ...parsed.data });

  // Recalculate reviewee's average rating
  const result = await db.select({ avg: avg(reviewsTable.rating) })
    .from(reviewsTable).where(eq(reviewsTable.revieweeId, parsed.data.revieweeId));
  const newRating = Number(result[0]?.avg ?? 5);
  await db.update(usersTable).set({ rating: newRating }).where(eq(usersTable.id, parsed.data.revieweeId));

  res.status(201).json({ success: true });
});

// GET /api/users/:id/reviews
router.get("/users/:id/reviews", async (req, res) => {
  const revieweeId = String(req.params.id);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.revieweeId, revieweeId));
  res.json({ reviews });
});

export default router;
