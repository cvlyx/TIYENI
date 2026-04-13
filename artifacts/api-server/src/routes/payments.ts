import { Router } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db/schema/payments";
import { notificationsTable } from "@workspace/db/schema/notifications";
import { eq } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { initiatePayment, verifyTransaction } from "../lib/paychangu";
import { genId } from "../lib/id";
import { z } from "zod";

const router = Router();

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const APP_RETURN_URL = process.env.APP_RETURN_URL ?? "tiyeni://wallet";

// GET /api/wallet — get balance + transactions
router.get("/wallet", requireAuth, async (req, res) => {
  const user = getUser(req);
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  const txns = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, user.id));
  res.json({ balance: wallet?.balance ?? 0, transactions: txns });
});

// POST /api/wallet/topup — initiate PayChangu checkout
router.post("/wallet/topup", requireAuth, async (req, res) => {
  const parsed = z.object({ amount: z.number().min(500), currency: z.enum(["MWK", "USD"]).default("MWK") }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);
  const txRef = genId("txref");
  const nameParts = user.name.split(" ");

  const result = await initiatePayment({
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    firstName: nameParts[0] ?? user.name,
    lastName: nameParts.slice(1).join(" ") || "-",
    txRef,
    callbackUrl: `${BASE_URL}/api/payments/callback`,
    returnUrl: APP_RETURN_URL,
    title: "Tiyeni Wallet Top-Up",
    description: `Add MWK ${parsed.data.amount.toLocaleString()} to your Tiyeni wallet`,
    meta: { userId: user.id, type: "topup" },
  });

  if (result.status !== "success" || !result.data) {
    res.status(502).json({ error: "Payment initiation failed", detail: result.message });
    return;
  }

  // Record pending transaction
  await db.insert(transactionsTable).values({
    id: genId("tx"), userId: user.id, type: "topup",
    amount: parsed.data.amount, currency: parsed.data.currency,
    description: "Wallet top-up (pending)", status: "pending", txRef,
  });

  res.json({ checkoutUrl: result.data.checkout_url, txRef });
});

// POST /api/payments/callback — PayChangu IPN webhook
router.post("/payments/callback", async (req, res) => {
  const { tx_ref, status } = req.body as { tx_ref: string; status: string };
  if (!tx_ref) { res.status(400).json({ error: "Missing tx_ref" }); return; }

  // Always verify server-side
  const verification = await verifyTransaction(tx_ref);
  if (verification.status !== "success" || verification.data?.status !== "successful") {
    // Mark failed
    await db.update(transactionsTable).set({ status: "failed" }).where(eq(transactionsTable.txRef, tx_ref));
    res.json({ received: true });
    return;
  }

  const vd = verification.data!;

  // Find the pending transaction
  const [txn] = await db.select().from(transactionsTable).where(eq(transactionsTable.txRef, tx_ref)).limit(1);
  if (!txn || txn.status === "completed") { res.json({ received: true }); return; }

  // Mark completed
  await db.update(transactionsTable).set({ status: "completed", paychanguRef: vd.transaction_id })
    .where(eq(transactionsTable.txRef, tx_ref));

  // Credit wallet
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, txn.userId)).limit(1);
  if (wallet) {
    await db.update(walletsTable).set({ balance: wallet.balance + vd.amount }).where(eq(walletsTable.userId, txn.userId));
  } else {
    await db.insert(walletsTable).values({ id: genId("w"), userId: txn.userId, balance: vd.amount });
  }

  // Notify user
  await db.insert(notificationsTable).values({
    id: genId("n"), userId: txn.userId, type: "wallet",
    title: "Wallet topped up",
    body: `MWK ${vd.amount.toLocaleString()} added to your Tiyeni wallet`,
    read: false,
  });

  res.json({ received: true });
});

// POST /api/wallet/withdraw
router.post("/wallet/withdraw", requireAuth, async (req, res) => {
  const parsed = z.object({ amount: z.number().min(1000), method: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const user = getUser(req);

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  if (!wallet || wallet.balance < parsed.data.amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(walletsTable).set({ balance: wallet.balance - parsed.data.amount }).where(eq(walletsTable.userId, user.id));
  await db.insert(transactionsTable).values({
    id: genId("tx"), userId: user.id, type: "withdrawal",
    amount: parsed.data.amount, currency: "MWK",
    description: `Withdrawal via ${parsed.data.method}`, status: "completed",
  });

  res.json({ success: true, newBalance: wallet.balance - parsed.data.amount });
});

export default router;
