import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tripsRouter from "./trips";
import parcelsRouter from "./parcels";
import bookingsRouter from "./bookings";
import paymentsRouter from "./payments";
import messagesRouter from "./messages";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tripsRouter);
router.use(parcelsRouter);
router.use(bookingsRouter);
router.use(paymentsRouter);
router.use(messagesRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);

export default router;
