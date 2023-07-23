import { Types } from "mongoose";

export interface SessionUser {
  userId: string | Types.ObjectId;
}
