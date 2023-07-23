import { Request } from "express";
import { Types } from "mongoose";
import { SessionUser } from "./index.js";
declare global {
  namespace Express {
    interface Request extends SessionUser {}
  }
}
