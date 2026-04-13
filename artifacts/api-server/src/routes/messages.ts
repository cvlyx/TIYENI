import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db/schema/messages";
import { usersTable } from "@workspace/db/schema/users";
import { eq, or, and } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { genId } from "../lib/id";
import { z } from "zod";

const router = Router();

// GET /api/conversations
router.get("/conversations", requireAuth, async (req, res) => {
  const user = getUser(req);
  const convos = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.participant1Id, user.id), eq(conversationsTable.participant2Id, user.id)));

  // Enrich with participant info
  const enriched = await Promise.all(convos.map(async (c) => {
    const otherId = c.participant1Id === user.id ? c.participant2Id : c.participant1Id;
    const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1);
    const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, c.id));
    return {
      ...c,
      participantId: otherId,
      participantName: other?.name ?? "Unknown",
      participantRating: other?.rating ?? 0,
      isVerified: other?.role === "verified",
      lastTimestamp: c.lastTimestamp,
      messages: msgs.map((m) => ({ ...m, timestamp: m.createdAt })),
    };
  }));

  res.json({ conversations: enriched });
});

// POST /api/conversations — start or get existing
router.post("/conversations", requireAuth, async (req, res) => {
  const parsed = z.object({ participantId: z.string(), relatedItemId: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);
  const { participantId, relatedItemId } = parsed.data;

  // Check existing
  const existing = await db.select().from(conversationsTable).where(
    or(
      and(eq(conversationsTable.participant1Id, user.id), eq(conversationsTable.participant2Id, participantId)),
      and(eq(conversationsTable.participant1Id, participantId), eq(conversationsTable.participant2Id, user.id))
    )
  ).limit(1);

  if (existing[0]) { res.json({ conversation: existing[0] }); return; }

  const id = genId("c");
  await db.insert(conversationsTable).values({ id, participant1Id: user.id, participant2Id: participantId, relatedItemId });
  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  res.status(201).json({ conversation: convo });
});

// POST /api/conversations/:id/messages
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const parsed = z.object({ text: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);

  const conversationId = String(req.params.id);
  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).limit(1);
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }
  if (convo.participant1Id !== user.id && convo.participant2Id !== user.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const msgId = genId("msg");
  await db.insert(messagesTable).values({ id: msgId, conversationId: convo.id, senderId: user.id, text: parsed.data.text });
  await db.update(conversationsTable).set({ lastMessage: parsed.data.text, lastTimestamp: new Date() }).where(eq(conversationsTable.id, convo.id));

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, msgId)).limit(1);
  res.status(201).json({ message: msg });
});

export default router;
