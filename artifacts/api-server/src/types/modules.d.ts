declare module "express-rate-limit" {
  import { Request, Response, NextFunction, RequestHandler } from "express";
  interface Options {
    windowMs?: number;
    max?: number;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    message?: any;
    keyGenerator?: (req: Request) => string;
  }
  function rateLimit(options?: Options): RequestHandler;
  export = rateLimit;
}

declare module "bcryptjs" {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}
