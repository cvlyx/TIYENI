import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Simple in-memory rate limiter (no external dependency needed)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function createRateLimiter(windowMs: number, max: number, message: object) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.headers["x-forwarded-for"] as string) ?? req.ip ?? "unknown";
    const now = Date.now();
    const entry = requestCounts.get(key);
    if (!entry || entry.resetAt < now) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.status(429).json(message);
      return;
    }
    next();
  };
}

const generalLimiter = createRateLimiter(15 * 60 * 1000, 200, { error: "Too many requests, please try again later" });
const otpLimiter = createRateLimiter(10 * 60 * 1000, 5, { error: "Too many OTP requests, please wait before trying again" });

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", generalLimiter);
app.use("/api/auth/request-otp", otpLimiter);
app.use("/api", router);

export default app;
