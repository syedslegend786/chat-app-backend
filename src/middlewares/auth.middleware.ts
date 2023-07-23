import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SessionUser } from "../types/index.js";
import User from "../models/user.js";
export const isUserSignedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else {
      return res.status(400).json({ msg: "You are not logged in." });
    }
    jwt.verify(
      token,
      process.env.JWT_SIGN_IN_SECRET,
      async function (err, decoded) {
        if (err) {
          return res.status(400).json({ msg: "You are not logged in." });
        }
        const body = decoded as SessionUser;
        const dbUser = await User.findById(body.userId);
        if (!dbUser) {
          return res.status(400).json({ msg: "Kindly logged in again." });
        }
        req.userId = dbUser._id;
        next();
      }
    );
  } catch (error: any) {
    return res.status(500).json({ msg: error.message });
  }
};
