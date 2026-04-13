import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema/notifications";
import { eq } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";

const router = Router();

// GET /api/notifications
router.get("/notifications", requireAuth, async (req, res) => {
  const user = getUser(req);
  const notifs = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id));
  res.json({ notifications: notifs });
});

// PATCH /api/notifications/read-all
router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const user = getUser(req);
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, user.id));
  res.json({ success: true });
});

export default router;
